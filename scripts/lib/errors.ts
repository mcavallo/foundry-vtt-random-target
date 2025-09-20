import path from 'node:path';
import z, { type ZodError } from 'zod';

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

export class InvalidSchemaError extends Error {
  constructor(public readonly zodError: ZodError) {
    super(`Invalid schema`);
    this.name = new.target.name;
  }

  get formattedError() {
    return z.prettifyError(this.zodError);
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

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ResponseError extends Error {
  constructor(
    message: string,
    public response: Response
  ) {
    super(message);
  }
}

export class InvalidResponseSchemaError extends InvalidSchemaError {}

export class InvalidResponseJsonError extends Error {}
