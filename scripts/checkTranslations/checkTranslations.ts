import path from 'node:path';
import { okAsync } from 'neverthrow';
import { HasTranslationErrors, NoLanguageFilesSkip } from './errors';
import {
  tryCheckAllLanguageFiles,
  tryReadEnglishPaths,
  tryReadLanguageFilenames,
} from './safeUtils';
import type { PipelineContext } from './types';
import { printErrorReport } from './utils';

export const run = async (rootDir: string) => {
  const ctx: PipelineContext = {
    langDir: path.join(rootDir, 'src', 'lang'),
  };

  await okAsync()
    .andTee(() => {
      console.log('Checking translation files...');
    })
    .andThen(tryReadLanguageFilenames(ctx))
    .andThen(tryReadEnglishPaths(ctx))
    .andThen(tryCheckAllLanguageFiles(ctx))
    .match(
      () => {
        console.log(`All good.`);
        process.exit(0);
      },
      (error) => {
        switch (true) {
          case error instanceof NoLanguageFilesSkip:
            console.log(`No language files found. Skipping.`);
            process.exit(0);
          case error instanceof HasTranslationErrors:
            printErrorReport(error);
            process.exit(1);
          default:
            console.log(error.message);
            process.exit(1);
        }
      }
    );
};
