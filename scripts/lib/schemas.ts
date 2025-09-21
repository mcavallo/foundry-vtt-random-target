import { z } from 'zod';

export const FullEnvSchema = z.object({
  DEV: z.preprocess(
    (val) => typeof val === 'string' && val.toLowerCase() === '1',
    z.boolean()
  ),
  GH_API_TOKEN: z.string().optional(),
  RELEASE_VERSION: z.string().optional(),
});

export const PackageJsonSchema = z.object({
  author: z.string(),
  authors: z.array(
    z.object({
      name: z.string(),
      discord: z.string(),
      url: z.string(),
    })
  ),
  repository: z.object({
    type: z.string(),
    url: z.string(),
  }),
  foundryModule: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    compatibilityMinimum: z.string(),
    compatibilityVerified: z.string(),
  }),
  license: z.string(),
});

export const ModuleCompatibilitySchema = z.object({
  minimum: z.string(),
  verified: z.string(),
  maximum: z.string().optional(),
});

export const ModuleJsonSchema = z.object({
  compatibility: ModuleCompatibilitySchema,
  id: z.string(),
  manifest: z.string(),
  url: z.string(),
  version: z.string(),
});

export type FullEnv = z.infer<typeof FullEnvSchema>;
export type PackageJson = z.infer<typeof PackageJsonSchema>;
export type ModuleJson = z.infer<typeof ModuleJsonSchema>;
