import fs from 'fs-extra';
import { fromPromise, okAsync } from 'neverthrow';
import path from 'path';

export function assertFoundryDataPath() {
  if (!Bun.env.FOUNDRY_DATA_PATH) {
    console.log(`No '%s' defined in '%s'`, 'FOUNDRY_DATA_PATH', '.env');
    process.exit(0);
  }
}

export function assertFoundryModulesPath(foundryModulesPath: string) {
  if (!fs.existsSync(foundryModulesPath)) {
    console.log(
      `The specified '%s' is invalid. Couldn't find the '%s' directory.`,
      'FOUNDRY_DATA_PATH',
      'modules',
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

  const packageJson = fs.readJSONSync(packageJsonPath);
  assertValidModuleId(packageJson.foundryModule.id);

  return packageJson.foundryModule.id;
}

export function getLinkDir() {
  assertFoundryDataPath();

  const foundryModulesPath = path.join(Bun.env.FOUNDRY_DATA_PATH, 'modules');
  assertFoundryModulesPath(foundryModulesPath);

  const moduleConfigPath = path.resolve(process.cwd(), 'src/module.json');
  assertModuleConfigPath(moduleConfigPath);

  const moduleId = readModuleId();
  return path.resolve(path.join(foundryModulesPath, moduleId));
}

export function getSymlinkType() {
  return process.platform === 'win32' || /^(msys|cygwin)$/.test(Bun.env.OSTYPE)
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

class ResponseException extends Error {
  constructor(response, status) {
    super();
    this.response = response;
    this.status = status;
  }
}

const identity = <T>(value: T) : T => value;

export const makeReleasePayload = moduleJson => ({
  id: moduleJson.name,
  release: {
    version: moduleJson.version,
    manifest: moduleJson.manifest,
    notes: `${moduleJson.url}/releases/tag/v${moduleJson.version}`,
    compatibility: moduleJson.compatibility,
  },
});

export const printRequestErrors = response => {
  let parsedErrors: string[] = [];

  Object.entries(response.errors ?? {}).forEach(([key, value]) => {
    switch (key) {
      case '__all__':
        Array.from(value).forEach(error => {
          parsedErrors.push(error.message);
        });
        break;
      default:
        Array.from(value).forEach(error => {
          parsedErrors.push(`${key}: ${error.message}`);
        });
        break;
    }
  });

  if (parsedErrors.length > 0) {
    console.error(`\nFound ${parsedErrors.length} errors:`);
    parsedErrors.forEach(errorMessage => {
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
    (_match, p1, p2, p3) => `${p1}${'*'.repeat(p2.length)}${p3}`,
  );
};

export const sendRequest = async ({ payload, isDryRun, token }) => {
  let body = Object.assign({}, payload);

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
    },
  );

  const jsonResponse = await fromPromise(resp.json(), identity).orElse(() =>
    okAsync({}),
  );

  if (!jsonResponse.isOk()) {
    throw jsonResponse.error;
  }

  if (!resp.ok) {
    throw new ResponseException(jsonResponse.value, resp.status);
  }

  return jsonResponse;
};

export const safeSendRequest = ({ payload, isDryRun, token }) =>
  fromPromise(sendRequest({ payload, isDryRun, token }), identity);
