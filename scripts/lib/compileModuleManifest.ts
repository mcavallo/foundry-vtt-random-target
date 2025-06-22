import path from 'node:path';
import type {
  BuildArtifactsDict,
  ReleaseData,
  ScriptContext,
} from '../../types/scripts.ts';

const compileModuleManifest = async ({
  ctx,
  bundleArtifacts,
  releaseData,
}: {
  ctx: ScriptContext;
  bundleArtifacts: BuildArtifactsDict;
  releaseData: ReleaseData;
}) => {
  console.log(`Compiling manifest...`);

  const rawManifest = await Bun.file(path.join(ctx.sourceDir, 'module.json')).text();
  const jsonManifest = JSON.parse(
    rawManifest
      .replaceAll('__AUTHOR__', ctx.packageJson.author)
      .replaceAll('__LICENSE__', ctx.packageJson.license)
      .replaceAll('__MODULE_ID__', ctx.packageJson.foundryModule.id)
      .replaceAll('__MODULE_TITLE__', ctx.packageJson.foundryModule.title)
      .replaceAll(
        '__MODULE_DESCRIPTION__',
        ctx.packageJson.foundryModule.description
      )
      .replaceAll(
        '__MODULE_COMPATIBILITY_MINIMUM__',
        ctx.packageJson.foundryModule.compatibilityMinimum
      )
      .replaceAll(
        '__MODULE_COMPATIBILITY_VERIFIED__',
        ctx.packageJson.foundryModule.compatibilityVerified
      )
      .replaceAll('__RELEASE__', releaseData.release)
      .replaceAll('__REPO_URL__', ctx.packageJson.repository.url)
      .replaceAll('__VERSION__', releaseData.version)
  );

  jsonManifest.authors = ctx.packageJson.authors;

  const moduleJsonPath = path.join(ctx.distDir, 'module.json');

  console.log(`Writing '${moduleJsonPath}'...`);

  await Bun.write(
    moduleJsonPath,
    JSON.stringify(
      {
        ...jsonManifest,
        ...bundleArtifacts,
      },
      null,
      2
    )
  );
};

export default compileModuleManifest;
