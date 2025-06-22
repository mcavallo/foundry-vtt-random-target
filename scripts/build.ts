import type { BundleConfig, ScriptContext } from '#/types/scripts.ts';
import path from 'node:path';
import bundle from './lib/bundle';
import compileModuleManifest from './lib/compileModuleManifest.ts';
import compilePacks from './lib/compilePacks.ts';
import computeRelease from './lib/computeRelease.ts';
import copyResources from './lib/copyResources.ts';
import { parseEnv, readPackageJson } from './lib/utils.ts';

const main = async () => {
  const env = await parseEnv();
  const packageJson = await readPackageJson();
  const rootDir = path.resolve(import.meta.dir, '..');

  const ctx: ScriptContext = {
    distDir: path.join(rootDir, 'dist'),
    env,
    packageJson,
    rootDir,
    sourceDir: path.join(rootDir, 'src'),
  };

  const releaseData = await computeRelease({ ctx });
  let bundleConfig: BundleConfig = {
    minify: false,
    naming: '[dir]/[name].[ext]',
    sourcemap: 'external',
  };

  if (releaseData.isReleaseBuild) {
    console.log(`Building release '${releaseData.version}'...`);
    bundleConfig = {
      minify: true,
      naming: '[dir]/[name].[hash].[ext]',
      sourcemap: 'none',
    };
  }

  await copyResources({ ctx });
  await compilePacks({ ctx });
  const bundleArtifacts = await bundle({ ctx, bundleConfig });
  await compileModuleManifest({ ctx, bundleArtifacts, releaseData });
};

void main();
