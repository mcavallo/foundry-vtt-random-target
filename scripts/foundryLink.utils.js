import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export const blue = chalk.blueBright;

export function assertFoundryDataPath() {
  if (!process.env.FOUNDRY_DATA_PATH) {
    console.log(`No '%s' defined in '%s'`, blue('FOUNDRY_DATA_PATH'), blue('.env'));
    process.exit(0);
  }
}

export function assertFoundryModulesPath(foundryModulesPath) {
  if (!fs.existsSync(foundryModulesPath)) {
    console.log(
      `The specified '%s' is invalid. Couldn't find the '%s' directory.`,
      blue('FOUNDRY_DATA_PATH'),
      blue('modules')
    );
    process.exit(0);
  }
}

export function assertModuleConfigPath(moduleConfigPath) {
  if (!fs.existsSync(moduleConfigPath)) {
    console.log(`The module config file '%s' is missing.`, blue(moduleConfigPath));
    process.exit(0);
  }
}

export function assertPackageJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`The package file '%s' is missing.`, blue(filePath));
    process.exit(0);
  }
}

export function assertValidModuleName(name) {
  if (!name.match(/^[a-z](?:[\w\d]+)*(?:-[\w\d]+)*$/)) {
    console.log(`The module name '%s' is not valid. Pick another.`, blue(name));
    process.exit(0);
  }
}

export function readModuleName() {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  assertPackageJson(packageJsonPath);

  const packageJson = fs.readJSONSync(packageJsonPath);
  assertValidModuleName(packageJson.foundryModule.name);

  return packageJson.foundryModule.name;
}

export function getLinkDir() {
  assertFoundryDataPath();

  const foundryModulesPath = path.join(process.env.FOUNDRY_DATA_PATH, 'modules');
  assertFoundryModulesPath(foundryModulesPath);

  const moduleConfigPath = path.resolve(process.cwd(), 'src/module.json');
  assertModuleConfigPath(moduleConfigPath);

  const moduleName = readModuleName();
  return path.resolve(path.join(foundryModulesPath, moduleName));
}

export function getSymlinkType() {
  return process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE) ? 'junction' : 'dir';
}

export function dirOrSymlinkExists(dirPath) {
  try {
    const stats = fs.lstatSync(dirPath);
    return stats.isSymbolicLink() || stats.isDirectory();
  } catch {
    return false;
  }
}

export function ensureLinked(linkDir) {
  if (!dirOrSymlinkExists(linkDir)) {
    console.log(`The directory '%s' is not linked.`, blue(linkDir));
    process.exit(0);
  }
}

export function ensureUnlinked(linkDir) {
  if (dirOrSymlinkExists(linkDir)) {
    console.log(`The directory '%s' is already linked.`, blue(linkDir));
    process.exit(0);
  }
}

export function ensureDistDir(distDir) {
  if (!fs.pathExistsSync(distDir)) {
    console.log(`Creating directory '%s'...`, blue(distDir));
    fs.mkdirpSync(distDir);
  }
}

export function createSymlink(linkDir) {
  ensureUnlinked(linkDir);

  const distDir = path.resolve('./dist');
  ensureDistDir(distDir);

  console.log(`Linking '%s' to '%s'...`, blue(distDir), blue(linkDir));
  fs.symlinkSync(distDir, linkDir, getSymlinkType());
}

export function removeSymlink(linkDir) {
  ensureLinked(linkDir);

  console.log(`Unlinking '%s'...`, blue(linkDir));
  fs.unlinkSync(linkDir);
}
