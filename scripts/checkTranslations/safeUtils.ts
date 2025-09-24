import path from 'node:path';
import { readdir } from 'fs/promises';
import { errAsync, fromPromise, okAsync } from 'neverthrow';
import { merge, piped, stringToPath } from 'remeda';
import { type Logger, logOk } from '#/scripts/lib/logger';
import {
  type CtxAndValue,
  ctxAndValue,
  okWithCtxAsync,
  sequenceAll,
} from '#/scripts/lib/neverthrow';
import { tryCheckDirExists, tryReadJsonFile } from '#/scripts/lib/safeUtils';
import {
  DirectoryReadFailedError,
  HasMissingPathsError,
  HasMissingTokensError,
  HasTranslationErrors,
  HasUnknownPathsError,
  HasUnknownTokensError,
  NoLanguageFilesSkip,
  TranslationFileError,
} from './errors';
import type {
  CheckTranslationsContext,
  TranslationFile,
  TranslationPathWithErrors,
} from './types';
import {
  calculateListDifferences,
  dropValues,
  extractLeafPaths,
  getTokensFromPath,
  keepOnlyJsonFileNames,
  mapStringToPathWithErrors,
} from './utils';

type PartialCtx<K extends keyof CheckTranslationsContext> = Require<
  CheckTranslationsContext,
  K
>;

/**
 * Reads the files in a directory.
 */
export const tryReadFilesInDir = (dirPath: string) =>
  tryCheckDirExists(dirPath).andThen(() =>
    fromPromise(readdir(dirPath), () => new DirectoryReadFailedError(dirPath))
  );

/**
 * Reads the language paths from a JSON file.
 */
export const tryReadLanguageFile = (filePath: string) => {
  return tryReadJsonFile(filePath).andThen((jsonContents) =>
    okAsync<TranslationFile>({
      json: jsonContents,
      paths: extractLeafPaths(jsonContents),
    })
  );
};

/**
 * Checks the translation file for path errors.
 */
export const tryCheckPathErrors =
  (baseTranslation: TranslationFile, filePath: string) =>
  (translation: TranslationFile) => {
    const errors: TranslationFileError[] = [];

    const { missing, unknown } = calculateListDifferences(
      baseTranslation.paths,
      translation.paths
    );

    if (missing.length > 0) {
      errors.push(
        new HasMissingPathsError(filePath, missing.map(mapStringToPathWithErrors))
      );
    }

    if (unknown.length > 0) {
      errors.push(
        new HasUnknownPathsError(filePath, unknown.map(mapStringToPathWithErrors))
      );
    }

    return errors.length > 0 ? errAsync(errors) : okAsync(translation);
  };

/**
 * Checks the translation file for token errors.
 */
export const tryCheckTokenErrors =
  (baseTranslation: TranslationFile, filePath: string) =>
  (translation: TranslationFile) => {
    const errors: TranslationFileError[] = [];
    const missingTokens: TranslationPathWithErrors[] = [];
    const unknownTokens: TranslationPathWithErrors[] = [];

    translation.paths.forEach((stringPath) => {
      const tPath = stringToPath(stringPath);
      const baseTokens = getTokensFromPath(baseTranslation.json, tPath);

      if (baseTokens.length === 0) {
        return;
      }

      const translationTokens = getTokensFromPath(translation.json, tPath);
      const { missing, unknown } = calculateListDifferences(
        baseTokens,
        translationTokens
      );

      if (missing.length > 0) {
        missingTokens.push([stringPath, missing]);
      }

      if (unknown.length > 0) {
        unknownTokens.push([stringPath, unknown]);
      }
    });

    if (missingTokens.length > 0) {
      errors.push(new HasMissingTokensError(filePath, missingTokens));
    }

    if (unknownTokens.length > 0) {
      errors.push(new HasUnknownTokensError(filePath, unknownTokens));
    }

    return errors.length > 0 ? errAsync(errors) : okAsync(translation);
  };

/**
 * Validates a language file.
 */
export const tryCheckLanguageFile = (
  baseTranslation: TranslationFile,
  filePath: string
) => {
  return tryReadLanguageFile(filePath)
    .andThen(tryCheckPathErrors(baseTranslation, filePath))
    .andThen(tryCheckTokenErrors(baseTranslation, filePath));
};

/**
 * Starts the pipeline and creates the context.
 * @pipeline
 */
export const startPipeline = (rootDir: string, logger: Logger) =>
  okWithCtxAsync({
    langDir: path.join(rootDir, 'src', 'lang'),
    logger,
  });

/**
 * Reads the list of language filenames excluding en.json.
 * @pipeline
 */
export const tryReadLanguageFilenames = ({
  ctx,
}: CtxAndValue<PartialCtx<'langDir' | 'logger'>>) =>
  tryReadFilesInDir(ctx.langDir)
    .map(piped(dropValues(['en.json']), keepOnlyJsonFileNames))
    .andThen((languageFileNames) =>
      languageFileNames.length > 0
        ? okWithCtxAsync(ctx, languageFileNames)
        : errAsync(new NoLanguageFilesSkip())
    );

/**
 * Reads the English language paths. Chains the languageFileNames as part of the output.
 * @pipeline
 */
export const tryReadEnglishLanguageFile = ({
  ctx,
  value: languageFileNames,
}: CtxAndValue<PartialCtx<'langDir' | 'logger'>, string[]>) =>
  tryReadLanguageFile(path.join(ctx.langDir, 'en.json')).map((baseTranslation) =>
    ctxAndValue(merge(ctx, { baseTranslation }), {
      languageFileNames,
    })
  );

/**
 * Checks each of the language files and collects all errors.
 * @pipeline
 */
export const tryCheckAllLanguageFiles = ({
  ctx,
  value: { languageFileNames },
}: CtxAndValue<
  CheckTranslationsContext,
  {
    languageFileNames: string[];
  }
>) => {
  const tasks = languageFileNames.map(
    (fileName) => () =>
      okWithCtxAsync(ctx)
        .andTee(logOk([`Checking '%s'...`, fileName]))
        .andThen(() =>
          tryCheckLanguageFile(ctx.baseTranslation, path.join(ctx.langDir, fileName))
        )
  );
  return sequenceAll(tasks)
    .map((results) =>
      results.flatMap((result) =>
        result.isOk()
          ? []
          : Array.isArray(result.error)
            ? result.error
            : [result.error]
      )
    )
    .andThen((errors) => {
      return errors.length === 0
        ? okWithCtxAsync(ctx)
        : errAsync(new HasTranslationErrors(errors));
    });
};
