import z, { type ZodError } from 'zod';

export class InvalidSchemaError extends Error {
  constructor(public readonly zodError: ZodError) {
    super(`Invalid schema`);
    this.name = new.target.name;
  }

  get formattedError() {
    return z.prettifyError(this.zodError);
  }
}

export class InvalidArgsSchemaError extends InvalidSchemaError {}
export class InvalidEnvSchemaError extends InvalidSchemaError {}
export class InvalidPackageJsonSchemaError extends InvalidSchemaError {}
