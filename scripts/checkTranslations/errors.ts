import path from 'node:path';

export class FileSystemError extends Error {
  public filePath: string;
  public fileName: string;

  constructor(message: string, filePath: string) {
    super(message);
    this.name = new.target.name;
    this.filePath = filePath;
    this.fileName = path.basename(filePath);
  }
}

export class TranslationFileError extends Error {
  public filePath: string;
  public fileName: string;
  public translationPaths: string[];

  constructor(message: string, filePath: string, translationPaths: string[]) {
    super(message);
    this.name = new.target.name;
    this.filePath = filePath;
    this.fileName = path.basename(filePath);
    this.translationPaths = translationPaths;
  }
}

export class DirectoryDoesntExistError extends FileSystemError {
  constructor(path: string) {
    super(`The directory doesn't exist`, path);
  }
}

export class DirectoryIsInvalidError extends FileSystemError {
  constructor(path: string) {
    super(`The directory is invalid`, path);
  }
}

export class DirectoryReadFailedError extends FileSystemError {
  constructor(path: string) {
    super(`Failed to read the directory`, path);
  }
}

export class FileDoesntExistError extends FileSystemError {
  constructor(path: string) {
    super(`The file doesn't exist`, path);
  }
}

export class JsonFileIsInvalidError extends FileSystemError {
  constructor(path: string) {
    super(`The file contains invalid JSON`, path);
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
  public errorsList: (JsonFileIsInvalidError | TranslationFileError)[];
  constructor(errorsList: (JsonFileIsInvalidError | TranslationFileError)[]) {
    super('Has translation errors');
    this.name = new.target.name;
    this.errorsList = errorsList;
  }
}

export class NoLanguageFilesSkip extends Error {}
