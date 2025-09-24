import { difference, prop } from 'remeda';
import { JsonFileIsInvalidError } from '#/scripts/lib/errors';
import {
  HasMissingPathsError,
  HasMissingTokensError,
  type HasTranslationErrors,
  HasUnknownPathsError,
  HasUnknownTokensError,
} from './errors';
import type { TranslationPathWithErrors } from './types';

/**
 * Formats a list of paths with errors providing indentation.
 */
export const formatPathWithErrorsList = (
  paths: TranslationPathWithErrors[],
  indentation: number = 2
) => {
  const indent = ' '.repeat(indentation);
  return paths
    .flatMap(([path, tokens]) =>
      [
        indent + path,
        Array.isArray(tokens)
          ? indent.repeat(2) + `Tokens: ${tokens.join(', ')}`
          : null,
      ].filter(Boolean)
    )
    .join('\n');
};

/**
 * Extracts the list of leaf paths from an object recursively.
 */
export const extractLeafPaths = (obj: any): string[] => {
  const paths: string[] = [];

  function traverse(node: any, currentPath: string) {
    if (node === null || node === undefined) return;

    if (
      typeof node === 'string' ||
      typeof node === 'number' ||
      typeof node === 'boolean'
    ) {
      paths.push(currentPath);
    } else if (Array.isArray(node)) {
      node.forEach((item, index) => {
        traverse(item, `${currentPath}[${index}]`);
      });
    } else if (typeof node === 'object') {
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          const newPath = currentPath ? `${currentPath}.${key}` : key;
          traverse(node[key], newPath);
        }
      }
    }
  }

  traverse(obj, '');
  return paths;
};

/**
 * Filters a source array of filenames keeping only items with the .json extension.
 */
export const keepOnlyJsonFileNames = (source: string[]) =>
  source.filter((fileName) => fileName.endsWith('.json'));

/**
 * Filters a source array dropping the specified values.
 */
export const dropValues =
  <T>(toDrop: T[]) =>
  (source: T[]) =>
    source.filter((value) => !toDrop.includes(value));

/**
 * Prints the error report for the aggregated error list.
 */
export const getErrorReportMessage = (container: HasTranslationErrors) => {
  const errorOutput = [`\nFound ${container.errorsList.length} errors:`];

  for (const error of container.errorsList) {
    switch (true) {
      case error instanceof JsonFileIsInvalidError:
        errorOutput.push(`The '${error.fileName}' language contains invalid JSON`);
        break;
      case error instanceof HasMissingPathsError:
        errorOutput.push(`The '${error.fileName}' language has unknown keys`);
        errorOutput.push(formatPathWithErrorsList(error.affectedPaths));
        break;
      case error instanceof HasUnknownPathsError:
        errorOutput.push(`The '${error.fileName}' language has missing keys`);
        errorOutput.push(formatPathWithErrorsList(error.affectedPaths));
        break;
      case error instanceof HasMissingTokensError:
        errorOutput.push(`The '${error.fileName}' language has missing tokens`);
        errorOutput.push(formatPathWithErrorsList(error.affectedPaths));
        break;
      case error instanceof HasUnknownTokensError:
        errorOutput.push(`The '${error.fileName}' language has unknown tokens`);
        errorOutput.push(formatPathWithErrorsList(error.affectedPaths));
        break;
    }
  }

  return errorOutput.join('\n');
};

/**
 * Map string to TranslationPathWithErrors
 */
export const mapStringToPathWithErrors = (
  path: string
): TranslationPathWithErrors => [path, null];

/**
 * Gets the sorted list of tokens present in a string.
 */
export const extractTokens = (str: string): string[] => {
  const regex = /\{([^\s{}]+)}/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    tokens.push(match[1]);
  }

  return tokens.sort();
};

/**
 * Gets the sorted list of tokens present in a translation path.
 */
export const getTokensFromPath = (
  data: object,
  translationPath: (string | number)[]
): string[] => {
  // @ts-expect-error the compiler wants to enforce this but a simpler check is fine
  const value: unknown = prop(data, ...translationPath);

  if (typeof value === 'string') {
    return extractTokens(value);
  }

  return [];
};

/**
 * Calculates the differences between 2 lists.
 */
export const calculateListDifferences = (source: string[], target: string[]) => {
  const missing = difference(source, target);
  const unknown = difference(target, source);
  return { missing, unknown };
};
