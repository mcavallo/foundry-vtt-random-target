import { z } from 'zod/v4';

export const envSchema = z.object({
  DEV: z.preprocess(
    (val) => typeof val === 'string' && val.toLowerCase() === '1',
    z.boolean()
  ),
  GH_API_TOKEN: z.string().optional(),
  RELEASE_VERSION: z.string().optional(),
});

export const packageSchema = z.object({
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

export type EnvSchema = z.infer<typeof envSchema>;
export type PackageSchema = z.infer<typeof packageSchema>;
