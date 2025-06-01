import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import lodash from 'lodash';

const { get } = lodash;

export const blue = chalk.blueBright;

/**
 * @typedef {Object} ReleaseData
 * @property {boolean} isReleaseBuild
 * @property {Object} package
 * @property {string} release
 * @property {string} version
 */

/**
 * @returns {Object}
 * @async
 */
export async function readPackageJson() {
  return await fs.readJson('package.json');
}

/**
 * @typedef {Object} ReleaseVersion
 * @property {string} release
 * @property {string} version
 */

/**
 * @param {Object} packageJson
 */
export function assertPackageJsonProperties(packageJson) {
  const requiredProperties = [
    'author',
    'authors',
    'foundryModule.id',
    'foundryModule.title',
    'foundryModule.description',
    'foundryModule.compatibilityMinimum',
    'foundryModule.compatibilityVerified',
    'repository.url',
    'license',
  ];

  for (const property of requiredProperties) {
    if (!get(packageJson, property)) {
      console.log(`The package.json is missing the '%s' property.`, blue(property));
      process.exit(0);
    }
  }
}

export function assertGithubApiToken() {
  if (!process.env.GH_API_TOKEN) {
    console.log(`'%' is missing.`, blue('GH_API_TOKEN'));
    process.exit(0);
  }
}

/**
 * @param {string} repoUrl
 * @returns {string}
 * @async
 */
export async function getLatestGithubRelease(repoUrl) {
  const [, repoOwner, repoName] = repoUrl.match(
    /^https?:\/\/(?:www.)?github.com\/([^/]+)\/(.+)$/
  );

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases?per_page=1`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${process.env.GH_API_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      // If there are no releases assume this is a new package
      if (data.length === 0) {
        return 'v1.0.0';
      }

      if (!data[0] || !data[0].tag_name) {
        throw new Error(
          `Couldn't read the tag name from the latest Github release.`
        );
      }

      return data[0].tag_name;
    }

    if (response.status === 404) {
      // If the release is missing assume this is a new package
      return 'v1.0.0';
    }

    if (response.status === 403 || response.status === 429) {
      throw new Error(
        `Couldn't fetch the latest Github release due to rate limiting.`
      );
    }

    throw new Error(
      `Failed to fetch the latest Github release with status ${response.status}.`
    );
  } catch (err) {
    console.log(err);
    process.exit(0);
  }
}

/**
 * @param {string} repoUrl
 * @returns {ReleaseVersion}
 */
export async function getReleaseVersion(repoUrl) {
  const fixedReleaseVersion = process.env.RELEASE_VERSION;

  if (fixedReleaseVersion) {
    return {
      version: fixedReleaseVersion.replace(/^(v)/, ''),
      release: fixedReleaseVersion,
    };
  }

  assertGithubApiToken();
  const githubReleaseVersion = await getLatestGithubRelease(repoUrl);
  const releaseVersion = [
    githubReleaseVersion,
    process.env.ROLLUP_WATCH ? '-dev' : '',
  ].join('');

  return {
    version: releaseVersion.replace(/^(v)/, ''),
    release: releaseVersion,
  };
}

/**
 * @param {Object} packageJson
 * @returns {ReleaseData}
 * @async
 */
export async function getReleaseData(packageJson) {
  const { release, version } = await getReleaseVersion(packageJson.repository.url);

  return {
    isReleaseBuild: !process.env.ROLLUP_WATCH,
    package: packageJson,
    release,
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
export function buildManifest({
  releaseData,
  esmodules = [],
  scripts = [],
  styles = [],
}) {
  const rawManifest = fs.readFileSync('src/module.json', 'utf8');
  const jsonManifest = JSON.parse(
    rawManifest
      .replaceAll('__AUTHOR__', releaseData.package.author)
      .replaceAll('__LICENSE__', releaseData.package.license)
      .replaceAll('__MODULE_ID__', releaseData.package.foundryModule.id)
      .replaceAll('__MODULE_TITLE__', releaseData.package.foundryModule.title)
      .replaceAll(
        '__MODULE_DESCRIPTION__',
        releaseData.package.foundryModule.description
      )
      .replaceAll(
        '__MODULE_COMPATIBILITY_MINIMUM__',
        releaseData.package.foundryModule.compatibilityMinimum
      )
      .replaceAll(
        '__MODULE_COMPATIBILITY_VERIFIED__',
        releaseData.package.foundryModule.compatibilityVerified
      )
      .replaceAll('__RELEASE__', releaseData.release)
      .replaceAll('__REPO_URL__', releaseData.package.repository.url)
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
