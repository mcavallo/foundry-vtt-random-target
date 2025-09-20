import fs from 'fs-extra';
import path from 'path';
import type packageJsonFile from '#/package.json';

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
