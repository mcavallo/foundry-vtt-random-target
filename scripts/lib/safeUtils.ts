import { lstat } from 'fs-extra';
import { type ResultAsync, errAsync, fromPromise, okAsync } from 'neverthrow';
import { pipe } from 'remeda';
import yargsParser from 'yargs-parser';
import z from 'zod';
import {
  ArgsFailedToParseError,
  DirectoryIsInvalidError,
  DirectoryStatFailedError,
  FileDoesntExistError,
  InvalidArgsSchemaError,
  InvalidSchemaError,
  JsonFileIsInvalidError,
} from '#/scripts/lib/errors';
import { getErrorMessage } from '#/scripts/lib/utils';

/**
 * Reads a file.
 */
export const tryReadFile = (filePath: string) =>
  okAsync(Bun.file(filePath)).andThen((file) =>
    fromPromise(file.exists(), (err) => err)
      .andThen((fileExists) => (fileExists ? okAsync(file) : errAsync()))
      .mapErr(() => new FileDoesntExistError(filePath))
  );

/**
 * Runs lstat on a directory.
 */
export const tryLstatDirectory = (dirPath: string) =>
  fromPromise(lstat(dirPath), () => new DirectoryStatFailedError(dirPath));

/**
 * Checks that a path exists and is a directory.
 */
export const tryCheckDirExists = (dirPath: string) =>
  tryLstatDirectory(dirPath).andThen((stats) =>
    stats.isDirectory() ? okAsync() : errAsync(new DirectoryIsInvalidError(dirPath))
  );

/**
 * Read and parse a JSON file.
 */
export const tryReadJsonFile = (filePath: string) => {
  return tryReadFile(filePath).andThen((file) =>
    fromPromise(file.json(), () => new JsonFileIsInvalidError(filePath))
  );
};

/**
 * Parses a value using a Zod schema.
 */
export const tryParseValueWithSchema = <Z extends z.ZodTypeAny = z.ZodNever>(
  schema: Z,
  value: unknown
): ResultAsync<z.infer<Z>, InvalidSchemaError> => {
  const result = schema.safeParse(value);
  return result.success
    ? okAsync(result.data)
    : errAsync(new InvalidSchemaError(result.error));
};

/**
 * Parses the scripts arguments using a Zod schema.
 */
export function tryParseArgsWithSchema<Z extends z.ZodTypeAny = z.ZodNever>(
  schema: Z,
  argv: string[],
  yargsOpts: yargsParser.Options = {}
): ResultAsync<z.infer<Z>, InvalidArgsSchemaError | ArgsFailedToParseError> {
  try {
    const parsed = yargsParser(argv.slice(2), yargsOpts);
    const result = schema.safeParse(parsed);
    return result.success
      ? okAsync(result.data)
      : errAsync(new InvalidArgsSchemaError(result.error));
  } catch (err) {
    return errAsync(
      pipe(err, getErrorMessage, (msg) => new ArgsFailedToParseError(msg))
    );
  }
}
