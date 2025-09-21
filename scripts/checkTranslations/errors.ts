import path from 'node:path';
import { FileSystemError, JsonFileIsInvalidError } from '#/scripts/lib/errors';

export class TranslationFileError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly translationPaths: string[]
  ) {
    super(message);
    this.name = new.target.name;
  }

  get fileName() {
    return path.basename(this.filePath);
  }
}

export class DirectoryReadFailedError extends FileSystemError {
  constructor(path: string) {
    super(`Failed to read the directory`, path);
  }
}

export class HasMissingPathsError extends TranslationFileError {
  constructor(filePath: string, translationPaths: string[]) {
    super('Translation file has missing paths', filePath, translationPaths);
  }
}

export class HasUnknownPathsError extends TranslationFileError {
  constructor(filePath: string, translationPaths: string[]) {
    super('Translation file has unknown paths', filePath, translationPaths);
  }
}

export class HasTranslationErrors extends Error {
  constructor(
    public readonly errorsList: (JsonFileIsInvalidError | TranslationFileError)[]
  ) {
    super('Has translation errors');
    this.name = new.target.name;
  }
}

export class NoLanguageFilesSkip extends Error {}
