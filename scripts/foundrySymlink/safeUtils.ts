import path from 'node:path';
import { symlink, unlink } from 'fs-extra';
import { errAsync, fromPromise, okAsync } from 'neverthrow';
import { merge } from 'remeda';
import {
  DirectoryAlreadyLinkedError,
  DirectoryNotLinkedError,
  LinkFailedError,
  UnlinkFailedError,
} from '#/scripts/foundrySymlink/errors';
import { FoundrySymlinkArgsSchema } from '#/scripts/foundrySymlink/schemas';
import type { FoundrySymlinkContext } from '#/scripts/foundrySymlink/types';
import {
  InvalidEnvSchemaError,
  InvalidPackageJsonSchemaError,
} from '#/scripts/lib/errors';
import { type Logger, logOk } from '#/scripts/lib/logger';
import {
  type CtxAndValue,
  ctxAndValue,
  okWithCtxAsync,
} from '#/scripts/lib/neverthrow';
import {
  tryCheckDirExists,
  tryLstatDirectory,
  tryParseArgsWithSchema,
  tryParseValueWithSchema,
  tryReadJsonFile,
} from '#/scripts/lib/safeUtils';
import { PackageJsonSchema } from '#/scripts/lib/schemas';
import { FoundrySymlinkEnvSchema } from './schemas';
import { getSymlinkType } from './utils';

type PartialCtx<K extends keyof FoundrySymlinkContext> = Require<
  FoundrySymlinkContext,
  K
>;

/**
 * Checks if the symlink already exists.
 */
export const tryEnsureUnlinked = ({ ctx }: CtxAndValue<FoundrySymlinkContext>) =>
  tryLstatDirectory(ctx.linkTargetDir)
    .orElse(() => okAsync(null))
    .andThen((stats) =>
      stats !== null && (stats.isSymbolicLink() || stats.isDirectory())
        ? errAsync(new DirectoryAlreadyLinkedError(ctx.linkTargetDir))
        : okWithCtxAsync(ctx)
    );

/**
 * Checks if the symlink is missing.
 */
export const tryEnsureLinked = ({ ctx }: CtxAndValue<FoundrySymlinkContext>) =>
  tryLstatDirectory(ctx.linkTargetDir)
    .orElse(() => okAsync(null))
    .andThen((stats) => {
      return stats === null ||
        !(stats && (stats.isSymbolicLink() || stats.isDirectory()))
        ? errAsync(new DirectoryNotLinkedError(ctx.linkTargetDir))
        : okWithCtxAsync(ctx);
    });

/**
 * Starts the pipeline and partially creates the context.
 * @pipeline
 */
export const startPipeline = (rootDir: string, logger: Logger) =>
  okWithCtxAsync({
    distDir: path.join(rootDir, 'dist'),
    logger,
    rootDir,
  });

/**
 * Parses the script arguments.
 * @pipeline
 */
export const tryParseArgs =
  (argv: string[]) =>
  ({ ctx }: CtxAndValue<PartialCtx<'distDir' | 'logger' | 'rootDir'>>) =>
    tryParseArgsWithSchema(FoundrySymlinkArgsSchema, argv).map((parsedArgs) =>
      ctxAndValue(merge(ctx, { command: parsedArgs._[0] }))
    );

/**
 * Parses the env.
 * @pipeline
 */
export const tryParseEnv =
  (env: unknown) =>
  ({ ctx }: CtxAndValue<PartialCtx<'distDir' | 'logger' | 'rootDir' | 'command'>>) =>
    tryParseValueWithSchema(FoundrySymlinkEnvSchema, env)
      .map((parsedEnv) =>
        ctxAndValue(
          merge(ctx, {
            foundryModulesDir: path.join(
              path.resolve(parsedEnv.FOUNDRY_DATA_PATH),
              'modules'
            ),
          })
        )
      )
      .mapErr((err) => new InvalidEnvSchemaError(err.zodError));

/**
 * Resolves the linkTargetDir using the module id.
 * @pipeline
 */
export const tryResolveLinkTargetDir = ({
  ctx,
}: CtxAndValue<
  PartialCtx<'distDir' | 'logger' | 'rootDir' | 'command' | 'foundryModulesDir'>
>) =>
  tryReadJsonFile(path.join(ctx.rootDir, 'package.json')).andThen((rawJson) =>
    tryParseValueWithSchema(PackageJsonSchema, rawJson)
      .map((moduleJson) =>
        ctxAndValue(
          merge(ctx, {
            moduleId: moduleJson.foundryModule.id,
            linkTargetDir: path.join(
              ctx.foundryModulesDir,
              moduleJson.foundryModule.id
            ),
          })
        )
      )
      .mapErr((err) => new InvalidPackageJsonSchemaError(err.zodError))
  );

/**
 * Creates the symlink in the linkTargetDir pointing to the distDir
 * @pipeline
 */
export const tryCreateSymlink = ({ ctx }: CtxAndValue<FoundrySymlinkContext>) =>
  okWithCtxAsync(ctx)
    .andThen(tryEnsureUnlinked)
    .andThen((v) => tryCheckDirExists(v.ctx.distDir).map(() => v))
    .andTee(logOk(`Creating symlink...`))
    .andThen((v) =>
      fromPromise(
        symlink(v.ctx.distDir, v.ctx.linkTargetDir, getSymlinkType()),
        () => new LinkFailedError(v.ctx.linkTargetDir)
      ).map(() => ctxAndValue(ctx))
    );

/**
 * Removes the symlink from the linkTargetDir
 * @pipeline
 */
export const tryRemoveSymlink = ({ ctx }: CtxAndValue<FoundrySymlinkContext>) =>
  okWithCtxAsync(ctx)
    .andThen(tryEnsureLinked)
    .andTee(logOk(`Removing symlink...`))
    .andThen((v) =>
      fromPromise(
        unlink(v.ctx.linkTargetDir),
        () => new UnlinkFailedError(v.ctx.linkTargetDir)
      ).map(() => ctxAndValue(ctx))
    );
