import path from 'node:path';
import type { TranslationPathWithErrors } from '#/scripts/checkTranslations/types.ts';
import { FileSystemError, JsonFileIsInvalidError } from '#/scripts/lib/errors';

export class TranslationFileError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly affectedPaths: TranslationPathWithErrors[]
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
  constructor(filePath: string, affectedPaths: TranslationPathWithErrors[]) {
    super('Translation file has missing paths', filePath, affectedPaths);
  }
}

export class HasUnknownPathsError extends TranslationFileError {
  constructor(filePath: string, affectedPaths: TranslationPathWithErrors[]) {
    super('Translation file has unknown paths', filePath, affectedPaths);
  }
}

export class HasMissingTokensError extends TranslationFileError {
  constructor(filePath: string, affectedPaths: TranslationPathWithErrors[]) {
    super('Translation file has missing tokens', filePath, affectedPaths);
  }
}

export class HasUnknownTokensError extends TranslationFileError {
  constructor(filePath: string, affectedPaths: TranslationPathWithErrors[]) {
    super('Translation file has unknown tokens', filePath, affectedPaths);
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
