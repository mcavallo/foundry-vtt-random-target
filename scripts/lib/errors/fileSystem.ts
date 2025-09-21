import path from 'node:path';

export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly filePath: string
  ) {
    super(message);
    this.name = new.target.name;
  }

  get fileName() {
    return path.basename(this.filePath);
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

export class DirectoryStatFailedError extends FileSystemError {
  constructor(path: string) {
    super(`The directory stat failed`, path);
  }
}

export class DirectoryIsInvalidError extends FileSystemError {
  constructor(path: string) {
    super(`The directory is invalid`, path);
  }
}
