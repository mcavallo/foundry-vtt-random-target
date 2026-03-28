import path from 'node:path';
import type {
  ArtifactType,
  BuildArtifactsDict,
  BundleConfig,
  ScriptContext,
} from '../../types/scripts';

const getArtifactType = (artifact: Bun.BuildArtifact): ArtifactType => {
  switch (path.extname(artifact.path)) {
    case '.js':
      return 'script';
    case '.mjs':
      return 'esmodule';
    case '.css':
      return 'style';
    default:
      return 'other';
  }
};

const bundle = async ({
  ctx,
  bundleConfig,
}: {
  ctx: ScriptContext;
  bundleConfig: BundleConfig;
}) => {
  console.log(`Bundling...`);

  const build = await Bun.build({
    entrypoints: ['src/module.ts'],
    outdir: 'dist',
    format: 'iife',
    ...bundleConfig,
  });

  const buildArtifacts = build.outputs.reduce<BuildArtifactsDict>(
    (acc, artifact) => {
      const fileName = path.relative(ctx.distDir, artifact.path);
      const artifactType = getArtifactType(artifact);

      if (artifactType === 'script') {
        acc.scripts.push(fileName);
      }

      if (artifactType === 'esmodule') {
        acc.esmodules.push(fileName);
      }

      if (artifactType === 'style') {
        acc.styles.push(fileName);
      }

      return acc;
    },
    {
      esmodules: [],
      scripts: [],
      styles: [],
    }
  );

  return buildArtifacts;
};

export default bundle;
