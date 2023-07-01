import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const config = fs.readJSONSync('foundryconfig.json');
const moduleConfig = fs.readJSONSync(path.resolve(process.cwd(), 'src', 'module.json'));
const moduleName = moduleConfig.name;
const foundryModulesPath = path.join(config.dataPath, 'modules');

const blue = chalk.blueBright;

if (!config.dataPath) {
  console.log(`No '${blue('dataPath')}' defined in '${blue('foundryconfig.json')}'`);
  process.exit(0);
}

if (!fs.existsSync(foundryModulesPath)) {
  console.log(`The specified '${blue('dataPath')}' is invalid. Couldn't find the '${blue('modules')} directory.`);
  process.exit(0);
}

const linkDir = path.join(foundryModulesPath, moduleName);

if (fs.existsSync(linkDir)) {
  console.log(`The specified '${blue('dataPath')}' is already linked.`);
  process.exit(0);
}

console.log(`Linking '${blue('dist')}' to '${blue(linkDir)}'...`);
fs.symlinkSync(path.resolve('./dist'), linkDir);
