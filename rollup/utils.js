import fs from 'fs-extra';
import yaml from 'js-yaml';
import fetch from 'node-fetch';

let CACHE = {};

/**
 * @typedef {Object} ReleaseData
 * @property {boolean} isReleaseBuild
 * @property {string} manifestUrl
 * @property {string} release
 * @property {string} repoUrl
 * @property {string} version
 */

/**
 * @typedef {Object} ReleaseVersion
 * @property {string} release
 * @property {string} version
 */

/**
 * @typedef {Object} ModuleManifest
 * @property {string} version
 * @property {string[]} esmodules
 * @property {string[]} scripts
 * @property {string[]} styles
 */

/**
 * @param {string} manifestUrl
 * @returns {ModuleManifest}
 * @async
 */
export async function fetchManifest(manifestUrl) {
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

/**
 * @param {string} manifestUrl
 * @returns {ReleaseVersion}
 */
export async function getReleaseVersion(manifestUrl) {
  const releaseVersion = process.env.RELEASE_VERSION;

  if (releaseVersion) {
    return {
      version: releaseVersion.replace(/^(v)/, ''),
      release: releaseVersion,
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
 * @param {string} repoUrl
 * @returns {ReleaseData}
 * @async
 */
export async function getReleaseData(repoUrl) {
  const rawManifest = fs.readJSONSync('src/module.json');
  const manifestUrl = rawManifest.manifest.replaceAll('__REPO__', repoUrl);
  const { release, version } = await getReleaseVersion(manifestUrl);

  return {
    isReleaseBuild: !process.env.ROLLUP_WATCH,
    manifestUrl,
    release,
    repoUrl,
    version,
  };
}

/**
 * @param {Object} input
 * @param {ReleaseData} input.releaseData
 * @param {string[]} input.esmodules
 * @param {string[]} input.scripts
 * @param {string[]} input.styles
 * @returns {ReleaseData}
 */
export function buildManifest({ releaseData, esmodules = [], scripts = [], styles = [] }) {
  const rawManifest = fs.readFileSync('src/module.json', 'utf8');
  const jsonManifest = JSON.parse(
    rawManifest
      .replaceAll('__REPO__', releaseData.repoUrl)
      .replaceAll('__RELEASE__', releaseData.release)
      .replaceAll('__VERSION__', releaseData.version)
  );

  return {
    ...jsonManifest,
    esmodules,
    scripts,
    styles,
  };
}

/**
 * @param {string} contents
 * @returns {String}
 */
export function compilePack(contents) {
  const doc = yaml.load(contents);
  return doc.reduce((acc, entry) => acc + `\n${JSON.stringify(entry)}`, '');
}
