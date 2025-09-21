import path from 'node:path';
import type { BunPlugin } from 'bun';
import * as sass from 'sass';
import type {
  ArtifactType,
  BuildArtifactsDict,
  BundleConfig,
  ScriptContext,
} from '../../types/scripts';

const sassPlugin: BunPlugin = {
  name: 'Sass Loader',
  async setup(build) {
    console.log(`Compiling styles...`);
    build.onLoad({ filter: /\.scss$/ }, async (args) => {
      const text = await Bun.file(args.path).text();
      const contents = await sass.compileStringAsync(text);
      const css = contents.css;

      return {
        loader: 'css',
        contents: css,
      };
    });
  },
};

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
    plugins: [sassPlugin],
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
