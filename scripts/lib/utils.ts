import { stat } from 'fs-extra';
import { z } from 'zod';
import {
  type EnvSchema,
  type PackageSchema,
  envSchema,
  packageSchema,
} from './schemas.ts';

export async function parseEnv(): Promise<EnvSchema> {
  const result = envSchema.safeParse(Bun.env);

  if (result.error) {
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }

  return result.data;
}

export async function readPackageJson(): Promise<PackageSchema> {
  const packageJson = await Bun.file('package.json').json();
  const result = packageSchema.safeParse(packageJson);

  if (result.error) {
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }

  return result.data;
}

export const fileExists = async (path: string) =>
  !!(await stat(path).catch(() => false));

export const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);
