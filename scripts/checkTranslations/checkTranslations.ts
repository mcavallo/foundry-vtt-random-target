import {
  DirectoryIsInvalidError,
  DirectoryStatFailedError,
  FileDoesntExistError,
  InvalidEnvSchemaError,
  JsonFileIsInvalidError,
} from '#/scripts/lib/errors';
import { logOk, logger } from '#/scripts/lib/logger';
import {
  assertNever,
  handlePipelineGenericError,
  handlePipelineUnexpectedError,
} from '#/scripts/lib/utils';
import {
  DirectoryReadFailedError,
  HasTranslationErrors,
  NoLanguageFilesSkip,
} from './errors';
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
        let exitCode = 1;
        switch (true) {
          case error instanceof InvalidEnvSchemaError:
          case error instanceof FileDoesntExistError:
          case error instanceof DirectoryStatFailedError:
          case error instanceof DirectoryIsInvalidError:
          case error instanceof JsonFileIsInvalidError:
            handlePipelineGenericError(logger, error);
            break;
          case error instanceof DirectoryReadFailedError:
            logger.error([`Failed to read the %s directory`, error.fileName]);
            break;
          case error instanceof NoLanguageFilesSkip:
            logger.info(`No language files found. Skipping.`);
            exitCode = 0;
            break;
          case error instanceof HasTranslationErrors:
            logger.error(getErrorReportMessage(error));
            break;
          default:
            handlePipelineUnexpectedError(logger, error);
            assertNever(error);
            break;
        }
        process.exit(exitCode);
      }
    );
};
