import { logOk, logger } from '#/scripts/lib/logger';
import { HasTranslationErrors, NoLanguageFilesSkip } from './errors';
import {
  startPipeline,
  tryCheckAllLanguageFiles,
  tryReadEnglishPaths,
  tryReadLanguageFilenames,
} from './safeUtils';
import { getErrorReportMessage } from './utils';

export const run = async (rootDir: string) => {
  await startPipeline(rootDir, logger)
    .andTee(logOk('Checking translation files...'))
    .andThen(tryReadLanguageFilenames)
    .andThen(tryReadEnglishPaths)
    .andThen(tryCheckAllLanguageFiles)
    .match(
      () => {
        logger.info(`All good.`);
        process.exit(0);
      },
      (error) => {
        switch (true) {
          case error instanceof NoLanguageFilesSkip:
            logger.info(`No language files found. Skipping.`);
            process.exit(0);
          case error instanceof HasTranslationErrors:
            logger.error(getErrorReportMessage(error));
            break;
          default:
            logger.error(error.message);
            break;
        }
        process.exit(1);
      }
    );
};
