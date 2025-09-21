import { type ResultAsync, errAsync } from 'neverthrow';
import {
  ArgsFailedToParseError,
  FileDoesntExistError,
  InvalidArgsSchemaError,
  InvalidEnvSchemaError,
  InvalidPackageJsonSchemaError,
  JsonFileIsInvalidError,
} from '#/scripts/lib/errors';
import { logger } from '#/scripts/lib/logger';
import type { CtxAndValue } from '#/scripts/lib/neverthrow';
import {
  assertNever,
  handlePipelineGenericError,
  handlePipelineUnexpectedError,
} from '#/scripts/lib/utils';
import {
  DirectoryAlreadyLinkedError,
  DirectoryNotLinkedError,
  UnsupportedCommandError,
} from './errors';
import {
  startPipeline,
  tryCreateSymlink,
  tryParseArgs,
  tryParseEnv,
  tryRemoveSymlink,
  tryResolveLinkTargetDir,
} from './safeUtils';
import type { FoundrySymlinkContext } from './types';

export const run = async (rootDir: string, argv: string[]) => {
  await startPipeline(rootDir, logger)
    .andThen(tryParseArgs(argv))
    .andThen(tryParseEnv(Bun.env))
    .andThen(tryResolveLinkTargetDir)
    .andThen(
      (
        args
      ): ResultAsync<
        CtxAndValue<FoundrySymlinkContext>,
        | DirectoryNotLinkedError
        | DirectoryAlreadyLinkedError
        | UnsupportedCommandError
      > => {
        switch (args.ctx.command) {
          case 'unlink':
            return tryRemoveSymlink(args);
          case 'link':
            return tryCreateSymlink(args);
          default:
            assertNever(args.ctx.command);
            return errAsync(new UnsupportedCommandError());
        }
      }
    )
    .match(
      ({ ctx }) => {
        switch (ctx.command) {
          case 'link':
            logger.info([`Created symlink '%s'.`, ctx.linkTargetDir]);
            break;
          case 'unlink':
            logger.info([`Removed symlink '%s'.`, ctx.linkTargetDir]);
            break;
        }
      },
      (error) => {
        let exitCode = 1;
        switch (true) {
          case error instanceof ArgsFailedToParseError:
          case error instanceof InvalidArgsSchemaError:
          case error instanceof InvalidEnvSchemaError:
          case error instanceof FileDoesntExistError:
          case error instanceof JsonFileIsInvalidError:
          case error instanceof InvalidPackageJsonSchemaError:
            handlePipelineGenericError(logger, error);
            break;
          case error instanceof UnsupportedCommandError:
            logger.error(`Unsupported command`);
            break;
          case error instanceof DirectoryAlreadyLinkedError:
            logger.error([`The %s directory is already linked`, error.fileName]);
            break;
          case error instanceof DirectoryNotLinkedError:
            logger.error([`The %s directory is not linked`, error.fileName]);
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
