import type { ReleaseData, ScriptContext } from '../../types/scripts.ts';

export const getLatestGithubRelease = async (repoUrl: string) => {
  const [, repoOwner, repoName] =
    repoUrl.match(/^https?:\/\/(?:www.)?github.com\/([^/]+)\/(.+)$/) || [];

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (Bun.env.GH_API_TOKEN) {
      headers.Authorization = `Bearer ${Bun.env.GH_API_TOKEN}`;
    } else {
      console.warn(`Warning: Fetching Github releases without a GH_API_TOKEN`);
    }

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/releases?per_page=1`,
      { headers }
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
    console.error(err);
    process.exit(1);
  }
};

export const getReleaseVersion = async ({ ctx }: { ctx: ScriptContext }) => {
  const repoUrl = ctx.packageJson.repository.url;
  const fixedReleaseVersion = process.env.RELEASE_VERSION;

  if (fixedReleaseVersion) {
    return {
      version: fixedReleaseVersion.replace(/^(v)/, ''),
      release: fixedReleaseVersion,
    };
  }

  const githubReleaseVersion = await getLatestGithubRelease(repoUrl);
  const releaseVersion = [githubReleaseVersion, ctx.env.DEV ? '-dev' : ''].join('');

  return {
    version: releaseVersion.replace(/^(v)/, ''),
    release: releaseVersion,
  };
};

export const computeRelease = async ({
  ctx,
}: {
  ctx: ScriptContext;
}): Promise<ReleaseData> => {
  const { release, version } = await getReleaseVersion({ ctx });

  return {
    isReleaseBuild: !ctx.env.DEV,
    release,
    version,
  };
};

export default computeRelease;
