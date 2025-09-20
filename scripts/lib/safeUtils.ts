import { type ResultAsync, errAsync, fromPromise, okAsync } from 'neverthrow';
import z from 'zod';
import {
  FileDoesntExistError,
  InvalidSchemaError,
  JsonFileIsInvalidError,
} from '#/scripts/lib/errors.ts';

/**
 * Checks if a file exists.
 */
export const tryCheckFileExists = (filePath: string) =>
  okAsync(Bun.file(filePath)).andThen((file) =>
    fromPromise(file.exists(), (err) => err)
      .andThen((fileExists) => (fileExists ? okAsync(file) : errAsync()))
      .mapErr(() => new FileDoesntExistError(filePath))
  );

/**
 * Read and parse a JSON file.
 */
export const tryReadJsonFile = (filePath: string) => {
  return tryCheckFileExists(filePath).andThen((file) =>
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
