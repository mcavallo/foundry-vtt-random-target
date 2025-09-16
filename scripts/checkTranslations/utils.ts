import {
  HasMissingPathsError,
  type HasTranslationErrors,
  HasUnknownPathsError,
  JsonFileIsInvalidError,
} from './errors';

/**
 * Formats a list of paths providing indentation.
 */
export const formatPathsList = (paths: string[], indentation: number = 2) => {
  const indent = ' '.repeat(indentation);
  return paths.map((path) => indent + path).join('\n');
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
export const printErrorReport = (container: HasTranslationErrors) => {
  const errorOutput = [`\nFound ${container.errorsList.length} errors:`];

  for (const error of container.errorsList) {
    switch (true) {
      case error instanceof JsonFileIsInvalidError:
        errorOutput.push(`The '${error.fileName}' language contains invalid JSON`);
        break;
      case error instanceof HasMissingPathsError:
        errorOutput.push(`The '${error.fileName}' language has unknown keys`);
        errorOutput.push(formatPathsList(error.translationPaths));
        break;
      case error instanceof HasUnknownPathsError:
        errorOutput.push(`The '${error.fileName}' language has missing keys`);
        errorOutput.push(formatPathsList(error.translationPaths));
        break;
    }
  }

  console.error(errorOutput.join('\n'));
};
