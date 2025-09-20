import path from 'node:path';
import { merge } from 'remeda';
import { type Logger, logOk } from '#/scripts/lib/logger';
import {
  type CtxAndValue,
  ctxAndValue,
  okWithCtxAsync,
} from '#/scripts/lib/neverthrow.ts';
import { tryParseValueWithSchema, tryReadJsonFile } from '#/scripts/lib/safeUtils';
import { InvalidEnvSchemaError, InvalidModuleJsonSchemaError } from './errors';
import { FoundryApiService } from './foundryApiService';
import { EnvSchema, ModuleJsonSchema } from './schemas';
import type { FoundryReleaseContext } from './types';
import { makeReleasePayload } from './utils';

type PartialCtx<K extends keyof FoundryReleaseContext> = Require<
  FoundryReleaseContext,
  K
>;

/**
 * Starts the pipeline and partially creates the context.
 */
export const startPipeline = (rootDir: string, logger: Logger) =>
  okWithCtxAsync({
    logger,
    distDir: path.join(rootDir, 'dist'),
  });

/**
 * Parses the environment variables. Adds the releaseToken and api to the context.
 */
export const tryParseEnv =
  (env: unknown) =>
  ({ ctx }: CtxAndValue<PartialCtx<'distDir' | 'logger'>>) =>
    tryParseValueWithSchema(EnvSchema, env)
      .map((parsedEnv) =>
        ctxAndValue(
          merge(ctx, {
            api: new FoundryApiService(parsedEnv.FOUNDRY_RELEASE_TOKEN),
            releaseToken: parsedEnv.FOUNDRY_RELEASE_TOKEN,
          })
        )
      )
      .mapErr((err) => new InvalidEnvSchemaError(err.zodError));

/**
 * Parses the module.json. Adds the releasePayload to the context.
 */
export const tryReadModuleJsonAndMakePayload = ({
  ctx,
}: CtxAndValue<PartialCtx<'distDir' | 'logger' | 'api' | 'releaseToken'>>) =>
  tryReadJsonFile(path.join(ctx.distDir, 'module.json')).andThen((rawJson) =>
    tryParseValueWithSchema(ModuleJsonSchema, rawJson)
      .map((moduleJson) =>
        ctxAndValue(
          merge(ctx, {
            releasePayload: makeReleasePayload(moduleJson),
          })
        )
      )
      .mapErr((err) => new InvalidModuleJsonSchemaError(err.zodError))
  );

/**
 * Sends the dry run request.
 */
export const trySendDryRunRequest = ({ ctx }: CtxAndValue<FoundryReleaseContext>) =>
  okWithCtxAsync(ctx)
    .andTee(logOk(`Sending dry run request....`))
    .andThen(() => ctx.api.releasePackage(ctx.releasePayload, true))
    .map(() => ctxAndValue(ctx))
    .andTee(logOk(`Dry run completed.`));

/**
 * Sends the release request.
 */
export const trySendReleaseRequest = ({ ctx }: CtxAndValue<FoundryReleaseContext>) =>
  okWithCtxAsync(ctx)
    .andTee(logOk(`Sending release request....`))
    .andThen(() => ctx.api.releasePackage(ctx.releasePayload, false))
    .map(() => ctxAndValue(ctx))
    .andTee(logOk(`Release completed.`));
