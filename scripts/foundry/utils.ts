import fs from 'fs-extra';
import { fromPromise } from 'neverthrow';
import path from 'path';
import type packageJsonFile from '#/package.json';
import type moduleJsonFile from '@/module.json';

interface FoundryReleasePayload {
  id: string;
  release: {
    version: string;
    manifest: string;
    notes?: string;
    compatibility: {
      minimum: string;
      verified: string;
      maximum?: string;
    };
  };
  'dry-run'?: boolean;
}

interface SendRequestArgs {
  payload: FoundryReleasePayload;
  isDryRun: boolean;
  token: string;
}

interface FoundryReleaseSuccessResponse {
  status: 'success';
  page: string;
  message?: string;
}

interface FoundryReleaseErrorResponse {
  status: 'error';
  errors?: {
    __all__?: { message: string; code: string }[];
    manifest?: { message: string; code: string }[];
  };
}

type FoundryReleaseResponse =
  | FoundryReleaseSuccessResponse
  | FoundryReleaseErrorResponse;

class ResponseException extends Error {
  response: FoundryReleaseErrorResponse;
  status: number;

  constructor(response: FoundryReleaseErrorResponse, status: number) {
    super();
    this.response = response;
    this.status = status;
  }
}

export function assertFoundryModulesPath(foundryModulesPath: string) {
  if (!fs.existsSync(foundryModulesPath)) {
    console.log(
      `The specified '%s' is invalid. Couldn't find the '%s' directory.`,
      'FOUNDRY_DATA_PATH',
      'modules'
    );
    process.exit(0);
  }
}

export function assertModuleConfigPath(moduleConfigPath: string) {
  if (!fs.existsSync(moduleConfigPath)) {
    console.log(`The module config file '%s' is missing.`, moduleConfigPath);
    process.exit(0);
  }
}

export function assertPackageJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.log(`The package file '%s' is missing.`, filePath);
    process.exit(0);
  }
}

export function assertValidModuleId(name: string) {
  if (!name.match(/^[a-z](?:[\w\d]+)*(?:-[\w\d]+)*$/)) {
    console.log(`The module name '%s' is not valid. Pick another.`, name);
    process.exit(0);
  }
}

export function readModuleId() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  assertPackageJson(packageJsonPath);

  const packageJson = fs.readJSONSync(packageJsonPath) as typeof packageJsonFile;
  assertValidModuleId(packageJson.foundryModule.id);

  return packageJson.foundryModule.id;
}

export function getLinkDir() {
  if (!Bun.env.FOUNDRY_DATA_PATH) {
    console.log(`No '%s' defined in '%s'`, 'FOUNDRY_DATA_PATH', '.env');
    process.exit(0);
  }

  const foundryModulesPath = path.join(Bun.env.FOUNDRY_DATA_PATH, 'modules');
  assertFoundryModulesPath(foundryModulesPath);

  const moduleConfigPath = path.resolve(process.cwd(), 'src/module.json');
  assertModuleConfigPath(moduleConfigPath);

  const moduleId = readModuleId();
  return path.resolve(path.join(foundryModulesPath, moduleId));
}

export function getSymlinkType() {
  return process.platform === 'win32' || /^(msys|cygwin)$/.test(Bun.env.OSTYPE ?? '')
    ? 'junction'
    : 'dir';
}

export function dirOrSymlinkExists(dirPath: string) {
  try {
    const stats = fs.lstatSync(dirPath);
    return stats.isSymbolicLink() || stats.isDirectory();
  } catch {
    return false;
  }
}

export function ensureLinked(linkDir: string) {
  if (!dirOrSymlinkExists(linkDir)) {
    console.log(`The directory '%s' is not linked.`, linkDir);
    process.exit(0);
  }
}

export function ensureUnlinked(linkDir: string) {
  if (dirOrSymlinkExists(linkDir)) {
    console.log(`The directory '%s' is already linked.`, linkDir);
    process.exit(0);
  }
}

export function ensureDistDir(distDir: string) {
  if (!fs.pathExistsSync(distDir)) {
    console.log(`Creating directory '%s'...`, distDir);
    fs.mkdirpSync(distDir);
  }
}

export function createSymlink(linkDir: string) {
  ensureUnlinked(linkDir);

  const distDir = path.resolve('./dist');
  ensureDistDir(distDir);

  console.log(`Linking '%s' to '%s'...`, distDir, linkDir);
  fs.symlinkSync(distDir, linkDir, getSymlinkType());
}

export function removeSymlink(linkDir: string) {
  ensureLinked(linkDir);

  console.log(`Unlinking '%s'...`, linkDir);
  fs.unlinkSync(linkDir);
}

const identity = <T>(value: T): T => value;

const passError = (e: unknown) => e;

export const makeReleasePayload = (
  moduleJson: typeof moduleJsonFile
): FoundryReleasePayload => ({
  id: moduleJson.name,
  release: {
    version: moduleJson.version,
    manifest: moduleJson.manifest,
    notes: `${moduleJson.url}/releases/tag/v${moduleJson.version}`,
    compatibility: moduleJson.compatibility,
  },
});

export const printRequestErrors = (err: unknown) => {
  let parsedErrors: string[] = [];

  if (err instanceof ResponseException) {
    Object.entries(err.response.errors ?? {}).forEach(([key, value]) => {
      switch (key) {
        case '__all__':
          Array.from(value).forEach((error) => {
            parsedErrors.push(error.message);
          });
          break;
        default:
          Array.from(value).forEach((error) => {
            parsedErrors.push(`${key}: ${error.message}`);
          });
          break;
      }
    });
  }

  if (parsedErrors.length > 0) {
    console.error(`\nFound ${parsedErrors.length} errors:`);
    parsedErrors.forEach((errorMessage) => {
      console.error(errorMessage);
    });
  }
};

export const maskToken = (token?: string) => {
  if (!token) {
    return 'unknown';
  }

  return token.replace(
    /^(.{6})(.+)(.{6})$/gi,
    (_match, p1, p2, p3) => `${p1}${'*'.repeat(p2.length)}${p3}`
  );
};

export const sendRequest = async ({ payload, isDryRun, token }: SendRequestArgs) => {
  let body: FoundryReleasePayload = Object.assign({}, payload);

  if (isDryRun) {
    body['dry-run'] = isDryRun;
  }

  const resp = await fetch(
    'https://api.foundryvtt.com/_api/packages/release_version/',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  const parseResult = await fromPromise<FoundryReleaseResponse, unknown>(
    resp.json(),
    passError
  );

  if (!parseResult.isOk()) {
    throw parseResult.error;
  }

  if (!resp.ok) {
    throw new ResponseException(
      parseResult.value as FoundryReleaseErrorResponse,
      resp.status
    );
  }

  return parseResult.value;
};

export const safeSendRequest = (args: SendRequestArgs) =>
  fromPromise(sendRequest(args), passError);
