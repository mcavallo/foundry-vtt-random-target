import path from 'node:path';
import { readdir, stat } from 'fs/promises';
import { errAsync, fromPromise, okAsync } from 'neverthrow';
import { difference, piped } from 'remeda';
import { sequenceAll } from '../lib/neverthrow';
import {
  DirectoryDoesntExistError,
  DirectoryIsInvalidError,
  DirectoryReadFailedError,
  FileDoesntExistError,
  HasMissingPathsError,
  HasTranslationErrors,
  HasUnknownPathsError,
  JsonFileIsInvalidError,
  NoLanguageFilesSkip,
  TranslationFileError,
} from './errors';
import type { PipelineContext } from './types';
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
 * Attempts to read and parse a JSON file.
 */
export const tryReadJsonFile = (filePath: string) => {
  const file = Bun.file(filePath);
  return fromPromise(
    file.exists(),
    () => new FileDoesntExistError(filePath)
  ).andThen(() =>
    fromPromise(file.json(), () => new JsonFileIsInvalidError(filePath))
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
 * Attempts to read the list of language filenames excluding en.json.
 */
export const tryReadLanguageFilenames = (ctx: PipelineContext) => () =>
  tryReadFilesInDir(ctx.langDir)
    .map(piped(dropValues(['en.json']), keepOnlyJsonFileNames))
    .andThen((fileNames) =>
      fileNames.length > 0 ? okAsync(fileNames) : errAsync(new NoLanguageFilesSkip())
    );

/**
 * Attempts to read the English language paths. Chains the languageFileNames as part
 * of the output.
 */
export const tryReadEnglishPaths =
  (ctx: PipelineContext) => (languageFileNames: string[]) =>
    tryReadLanguageFilePaths(path.join(ctx.langDir, 'en.json')).map(
      (englishTranslationPaths): [string[], string[]] => [
        englishTranslationPaths,
        languageFileNames,
      ]
    );

/**
 * Attempts to check each of the language files and collects all errors.
 */
export const tryCheckAllLanguageFiles =
  (ctx: PipelineContext) =>
  ([englishTranslationPaths, languageFileNames]: [string[], string[]]) => {
    const tasks = languageFileNames.map(
      (fileName) => () =>
        okAsync()
          .andTee(() => {
            console.log(`Checking '${fileName}'...`);
          })
          .andThen(() =>
            tryCheckLanguageFile(
              englishTranslationPaths,
              path.join(ctx.langDir, fileName)
            )
          )
    );
    return sequenceAll(tasks)
      .map((results) =>
        results.flatMap((result) => {
          return result.isOk()
            ? []
            : Array.isArray(result.error)
              ? result.error
              : [result.error];
        })
      )
      .andThen((errors) => {
        return errors.length === 0
          ? okAsync()
          : errAsync(new HasTranslationErrors(errors));
      });
  };
