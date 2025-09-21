import {
  FileDoesntExistError,
  InvalidEnvSchemaError,
  InvalidModuleJsonSchemaError,
  InvalidResponseSchemaError,
  JsonFileIsInvalidError,
  RequestError,
  ResponseError,
} from '#/scripts/lib/errors';
import { logOk, logger } from '#/scripts/lib/logger';
import {
  assertNever,
  handlePipelineGenericError,
  handlePipelineUnexpectedError,
} from '#/scripts/lib/utils';
import {
  startPipeline,
  tryParseEnv,
  tryReadModuleJsonAndMakePayload,
  trySendDryRunRequest,
  trySendReleaseRequest,
} from './safeUtils';
import { maskToken } from './utils';

export const run = async (rootDir: string) => {
  await startPipeline(rootDir, logger)
    .andThen(tryParseEnv(Bun.env))
    .andTee(logOk('Reading module.json...'))
    .andThen(tryReadModuleJsonAndMakePayload)
    .andTee(({ ctx }) => {
      logger.info([
        `Releasing '%s' using token '%s'...`,
        ctx.releasePayload.id,
        maskToken(ctx.releaseToken),
      ]);
    })
    .andThen(trySendDryRunRequest)
    .andTee(trySendReleaseRequest)
    .match(
      (v) => {
        logger.info(`All good.`);
        process.exit(0);
      },
      (error) => {
        let exitCode = 1;
        switch (true) {
          case error instanceof InvalidEnvSchemaError:
          case error instanceof FileDoesntExistError:
          case error instanceof JsonFileIsInvalidError:
            handlePipelineGenericError(logger, error);
            break;
          case error instanceof InvalidModuleJsonSchemaError:
            logger.error(`The module.json schema is invalid`);
            logger.error(error.formattedError);
            break;
          case error instanceof InvalidResponseSchemaError:
            logger.error(`The response schema is invalid`);
            logger.error(error.formattedError);
            break;
          case error instanceof RequestError:
            logger.error(`Failed to send the release request`);
            logger.error(error.message);
            break;
          case error instanceof ResponseError:
            logger.error([`Release failed with status %d`, error.response.status]);
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
