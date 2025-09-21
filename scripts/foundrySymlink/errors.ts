import { FileSystemError } from '#/scripts/lib/errors';

export class DirectoryAlreadyLinkedError extends FileSystemError {
  constructor(public readonly filePath: string) {
    super(`The directory is already linked`, filePath);
    this.name = new.target.name;
  }
}

export class DirectoryNotLinkedError extends FileSystemError {
  constructor(public readonly filePath: string) {
    super(`The directory is not linked`, filePath);
    this.name = new.target.name;
  }
}

export class UnsupportedCommandError extends Error {}

export class LinkFailedError extends FileSystemError {
  constructor(public readonly filePath: string) {
    super(`Failed to link directory`, filePath);
    this.name = new.target.name;
  }
}

export class UnlinkFailedError extends FileSystemError {
  constructor(public readonly filePath: string) {
    super(`Failed to unlink directory`, filePath);
    this.name = new.target.name;
  }
}
