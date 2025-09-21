import {
  ArgsFailedToParseError,
  DirectoryIsInvalidError,
  DirectoryStatFailedError,
  FileDoesntExistError,
  InvalidArgsSchemaError,
  InvalidEnvSchemaError,
  InvalidPackageJsonSchemaError,
  JsonFileIsInvalidError,
} from '#/scripts/lib/errors';
import { type Logger } from '#/scripts/lib/logger';

/**
 * Resolves a message from an error.
 */
export const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

/**
 * Handles unexpected errors that can happen within a pipeline.
 */
export const handlePipelineUnexpectedError = (logger: Logger, error: unknown) => {
  const [name, message] =
    error instanceof Error
      ? [error.constructor.name, getErrorMessage(error)]
      : [typeof error, String(error)];
  logger.error([`Unexpected error %s: %s`, name, message]);
};

/**
 * Handles generic errors that can happen within a pipeline.
 */
export const handlePipelineGenericError = (logger: Logger, error: unknown) => {
  switch (true) {
    case error instanceof ArgsFailedToParseError:
      logger.error(`Failed to parse the script arguments`);
      break;
    case error instanceof InvalidArgsSchemaError:
      logger.error([`Invalid arguments`, error.formattedError].join(`\n`));
      break;
    case error instanceof InvalidEnvSchemaError:
      logger.error([`The env schema is invalid`, error.formattedError].join(`\n`));
      break;
    case error instanceof FileDoesntExistError:
      logger.error([`The %s file is missing`, error.fileName]);
      break;
    case error instanceof DirectoryStatFailedError:
      logger.error([`Failed to run lstat on %s`, error.fileName]);
      break;
    case error instanceof DirectoryIsInvalidError:
      logger.error([`The %s directory is invalid`, error.fileName]);
      break;
    case error instanceof JsonFileIsInvalidError:
      logger.error([`Failed to parse the %s file`, error.fileName]);
      break;
    case error instanceof InvalidPackageJsonSchemaError:
      logger.error(
        [`The package.json schema is invalid`, error.formattedError].join(`\n`)
      );
      break;
  }
};

export const isGenericError = (error: unknown) => {
  if (error instanceof ArgsFailedToParseError) {
    return true;
  }

  return false;
};
