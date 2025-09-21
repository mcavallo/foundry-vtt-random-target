export * from './fileSystem';
export * from './schema';

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ResponseError extends Error {
  constructor(
    message: string,
    public response: Response
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidResponseJsonError extends Error {}

export class ArgsFailedToParseError extends Error {}
