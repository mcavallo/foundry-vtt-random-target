import { stat } from 'fs-extra';
import { z } from 'zod';
import {
  type FullEnv,
  FullEnvSchema,
  type PackageJson,
  PackageJsonSchema,
} from '../schemas';

export * from './errors';

export async function parseEnv(): Promise<FullEnv> {
  const result = FullEnvSchema.safeParse(Bun.env);

  if (result.error) {
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }

  return result.data;
}

export async function readPackageJson(): Promise<PackageJson> {
  const packageJson = await Bun.file('package.json').json();
  const result = PackageJsonSchema.safeParse(packageJson);

  if (result.error) {
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }

  return result.data;
}

export const fileExists = async (path: string) =>
  !!(await stat(path).catch(() => false));

export const assertNever = (value: never) => {};
