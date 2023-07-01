import chalk from 'chalk';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import { terser } from 'rollup-plugin-terser';
import watch from 'rollup-plugin-watch';
import outputManifest from './rollup/plugin-manifest.js';
import { buildManifest, compilePack, getReleaseData } from './rollup/utils.js';

const REPO_URL = 'https://github.com/mcavallo/foundry-vtt-random-target';

export default async () => {
  const releaseData = await getReleaseData(REPO_URL);

  if (releaseData.isReleaseBuild) {
    console.log(`Building release '${chalk.blueBright(releaseData.version)}'...`);
  }

  return {
    input: {
      module: 'src/main.js',
    },
    output: {
      entryFileNames: '[name]-[hash:12].js',
      assetFileNames: '[name]-[hash:12].[ext]',
      dir: './dist/',
      format: 'iife',
      sourcemap: releaseData.isReleaseBuild ? false : true,
    },
    plugins: [
      watch({ dir: 'src' }),
      styles({
        mode: 'extract',
        sass: {
          outputStyle: releaseData.isReleaseBuild ? 'compressed' : 'expanded',
        },
      }),
      copy({
        targets: [
          {
            src: 'src/packs/*.yaml',
            dest: 'dist/packs',
            rename: name => `${name}.db`,
            transform: compilePack,
          },
          {
            src: 'src/assets/**/*',
            dest: 'dist/assets',
          },
          {
            src: 'src/templates/**/*',
            dest: 'dist/templates',
          },
          {
            src: 'LICENSE',
            dest: 'dist',
          },
        ],
      }),
      outputManifest({
        fileName: 'module.json',
        generate: () => chunks => {
          const mainModuleName = chunks.find(chunk => chunk.type === 'chunk' && chunk.name === 'module').fileName;
          const stylesName = chunks.find(chunk => chunk.type === 'asset' && chunk.name === 'module.css').fileName;

          return buildManifest({ releaseData, scripts: [mainModuleName], styles: [stylesName] });
        },
      }),
      releaseData.isReleaseBuild && terser(),
    ],
  };
};
