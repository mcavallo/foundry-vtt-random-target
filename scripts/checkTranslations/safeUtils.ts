import path from 'node:path';
import { readdir, stat } from 'fs/promises';
import { errAsync, fromPromise, okAsync } from 'neverthrow';
import { difference, piped } from 'remeda';
import { type Logger, logOk } from '#/scripts/lib/logger';
import {
  type CtxAndValue,
  ctxAndValue,
  okWithCtxAsync,
  sequenceAll,
} from '#/scripts/lib/neverthrow';
import { tryReadJsonFile } from '#/scripts/lib/safeUtils';
import {
  DirectoryDoesntExistError,
  DirectoryIsInvalidError,
  DirectoryReadFailedError,
  HasMissingPathsError,
  HasTranslationErrors,
  HasUnknownPathsError,
  NoLanguageFilesSkip,
  TranslationFileError,
} from './errors';
import type { CheckTranslationsContext } from './types';
import { dropValues, extractLeafPaths, keepOnlyJsonFileNames } from './utils';

/**
 * Attempts to read the files in a directory.
 */
export const tryReadFilesInDir = (dirPath: string) => {
  return fromPromise(stat(dirPath), () => new DirectoryDoesntExistError(dirPath))
    .andThen((dirStat) =>
      dirStat.isDirectory()
        ? okAsync()
        : errAsync(new DirectoryIsInvalidError(dirPath))
    )
    .andThen(() =>
      fromPromise(readdir(dirPath), () => new DirectoryReadFailedError(dirPath))
    );
};

/**
 * Attempts to read the language paths from a JSON file.
 */
export const tryReadLanguageFilePaths = (filePath: string) => {
  return tryReadJsonFile(filePath).map(extractLeafPaths);
};

/**
 * Attempts to validate a language file.
 */
export const tryCheckLanguageFile = (
  baseTranslationPaths: string[],
  filePath: string
) => {
  return tryReadLanguageFilePaths(filePath).andThen((paths) => {
    const errors: TranslationFileError[] = [];

    const missingPaths = difference(baseTranslationPaths, paths);
    const unknownPaths = difference(paths, baseTranslationPaths);

    if (missingPaths.length > 0) {
      errors.push(new HasMissingPathsError(filePath, missingPaths));
    }

    if (unknownPaths.length > 0) {
      errors.push(new HasUnknownPathsError(filePath, unknownPaths));
    }

    return errors.length > 0 ? errAsync(errors) : okAsync();
  });
};

/**
 * Starts the pipeline and creates the context.
 */
export const startPipeline = (rootDir: string, logger: Logger) =>
  okWithCtxAsync({
    langDir: path.join(rootDir, 'src', 'lang'),
    logger,
  });

/**
 * Attempts to read the list of language filenames excluding en.json.
 */
export const tryReadLanguageFilenames = ({
  ctx,
}: CtxAndValue<CheckTranslationsContext>) =>
  tryReadFilesInDir(ctx.langDir)
    .map(piped(dropValues(['en.json']), keepOnlyJsonFileNames))
    .andThen((languageFileNames) =>
      languageFileNames.length > 0
        ? okWithCtxAsync(ctx, languageFileNames)
        : errAsync(new NoLanguageFilesSkip())
    );

/**
 * Attempts to read the English language paths. Chains the languageFileNames as part
 * of the output.
 */
export const tryReadEnglishPaths = ({
  ctx,
  value: languageFileNames,
}: CtxAndValue<CheckTranslationsContext, string[]>) =>
  tryReadLanguageFilePaths(path.join(ctx.langDir, 'en.json')).map(
    (englishTranslationPaths) =>
      ctxAndValue(ctx, {
        englishTranslationPaths,
        languageFileNames,
      })
  );

/**
 * Attempts to check each of the language files and collects all errors.
 */
export const tryCheckAllLanguageFiles = ({
  ctx,
  value: { englishTranslationPaths, languageFileNames },
}: CtxAndValue<
  CheckTranslationsContext,
  {
    englishTranslationPaths: string[];
    languageFileNames: string[];
  }
>) => {
  const tasks = languageFileNames.map(
    (fileName) => () =>
      okWithCtxAsync(ctx)
        .andTee(logOk([`Checking '%s'...`, fileName]))
        .andThen(() =>
          tryCheckLanguageFile(
            englishTranslationPaths,
            path.join(ctx.langDir, fileName)
          )
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
