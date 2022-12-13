const chalk = require('chalk');
const del = require('del');
const fetch = require('node-fetch');
const file = require('gulp-file');
const fs = require('fs-extra');
const gulp = require('gulp');
const path = require('path');
const minimist = require('minimist');

let CACHE = {};

// Config
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const GLOBS = {
  STYLES: 'src/**/*.scss',
  ASSETS: 'src/assets/**/*',
  TEMPLATES: 'src/templates/**/*',
  PACKS: 'src/packs/**/*',
  SCRIPTS: 'src/**/*.js',
  MAIN_JS: 'src/module.mjs',
  MANIFEST: 'src/module.json',
  LICENSE: 'LICENSE',
};

// Sass
const gulpsass = require('gulp-sass')(require('dart-sass'));
gulpsass.compiler = require('dart-sass');

function getArgs() {
  return minimist(process.argv.slice(2), {
    string: ['release'],
  });
}

async function fetchManifest(manifestUrl) {
  if (CACHE[manifestUrl]) {
    return CACHE[manifestUrl];
  } else {
    try {
      const resp = await fetch(manifestUrl);
      const output = await resp.json();
      CACHE[manifestUrl] = output;
      return output;
    } catch (err) {
      throw new Error(`Failed to fetch latest manifest`, err);
    }
  }
}

async function getReleaseVersion(manifestUrl) {
  const args = getArgs();

  if (args.release) {
    return {
      version: args.release.replace(/^(v)/, ''),
      release: args.release,
    };
  }

  const latestManifest = await fetchManifest(manifestUrl);
  const version = latestManifest.version + '-dev';

  return {
    version,
    release: `v${version}`,
  };
}

/**
 * Removes all files from the dist directory
 *
 * @task
 */
async function cleanDist() {
  const files = fs.readdirSync(DIST_DIR);
  for (const file of files) {
    await del(path.resolve(DIST_DIR, file));
  }
}

/**
 * Copies assets into their respective locations on the dist directory
 *
 * @task
 */
async function copyAssets() {
  gulp.src(GLOBS.LICENSE).pipe(gulp.dest(path.resolve(DIST_DIR)));
  gulp.src(GLOBS.ASSETS).pipe(gulp.dest(path.resolve(DIST_DIR, 'assets')));
  gulp.src(GLOBS.TEMPLATES).pipe(gulp.dest(path.resolve(DIST_DIR, 'templates')));
}

/**
 * Compiles the packs for the module. Right now this is just a copy
 *
 * @task
 */
async function buildPacks() {
  gulp.src(GLOBS.PACKS).pipe(gulp.dest(path.resolve(DIST_DIR, 'packs')));
}

/**
 * Copies the scripts for the module into their respective locations on the dist directory
 *
 * @task
 */
async function copyScripts() {
  gulp.src(GLOBS.SCRIPTS).pipe(gulp.dest(path.resolve(DIST_DIR)));
  gulp.src(GLOBS.MAIN_JS).pipe(gulp.dest(path.resolve(DIST_DIR)));
}

/**
 * Compiles the manifest and outputs a the file into the dist directory
 *
 * @task
 */
async function buildManifest() {
  const rawManifest = fs.readJSONSync('src/module.json');

  const manifestUrl = rawManifest.manifest.replaceAll('__REPO__', rawManifest.url);
  const { release, version } = await getReleaseVersion(manifestUrl);

  const manifest = {
    ...rawManifest,
    manifest: manifestUrl,
    version: version,
    download: rawManifest.download.replaceAll('__REPO__', rawManifest.url).replaceAll('__RELEASE__', release),
  };

  return file('module.json', JSON.stringify(manifest, null, 2), { src: true }).pipe(gulp.dest(path.resolve(DIST_DIR)));
}

/**
 * Compiles the styles for the module and outputs the CSS into the dist directory
 *
 * @task
 */
async function buildSass() {
  return gulp
    .src('src/css/module.scss')
    .pipe(gulpsass().on('error', gulpsass.logError))
    .pipe(gulp.dest(path.resolve(DIST_DIR, 'css')));
}

/**
 * Watches the file system and processes any relevant files
 *
 * @task
 */
async function watch() {
  gulp.watch([GLOBS.ASSETS, GLOBS.TEMPLATES, GLOBS.PACKS]).on('change', async () => await copyAssets());
  gulp.watch([GLOBS.SCRIPTS, GLOBS.MAIN_JS]).on('change', async () => await copyScripts());
  gulp.watch(GLOBS.STYLES).on('change', async () => await buildSass());
  gulp.watch(GLOBS.MANIFEST).on('change', async () => await buildManifest());
}

/**
 * Links the dist directory to the local foundry data directory
 *
 * @task
 */
async function linkFoundryData() {
  const config = fs.readJSONSync('foundryconfig.json');
  const moduleConfig = fs.readJSONSync(path.resolve(process.cwd(), 'src', 'module.json'));
  const moduleName = moduleConfig.name;

  const foundryModulesPath = path.join(config.dataPath, 'modules');

  try {
    if (!config.dataPath) {
      throw Error(`No 'dataPath' defined in foundryconfig.json`);
    }

    if (!fs.existsSync(foundryModulesPath)) {
      throw Error(`The specified 'dataPath' is invalid. Couldn't find the 'modules' directory.`);
    }

    const linkDir = path.join(foundryModulesPath, moduleName);

    if (fs.existsSync(linkDir)) {
      throw Error(`The specified 'dataPath' is already linked.`);
    }

    console.log(`Linking '${chalk.blueBright('dist')}' to '${chalk.blueBright(linkDir)}'...`);
    await fs.symlink(path.resolve('./dist'), linkDir);

    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

exports.clean = cleanDist;
exports.manifest = buildManifest;
exports.sass = buildSass;
exports.build = gulp.series(copyAssets, buildPacks, copyScripts, buildSass, buildManifest);
exports.rebuild = gulp.series(cleanDist, exports.build);
exports.watch = gulp.series(exports.rebuild, watch);
exports.link = linkFoundryData;
