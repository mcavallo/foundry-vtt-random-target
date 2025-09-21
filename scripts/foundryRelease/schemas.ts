import { z } from 'zod';
import { ModuleCompatibilitySchema } from '#/scripts/lib/schemas';

export const EnvSchema = z.object({
  FOUNDRY_RELEASE_TOKEN: z.string(),
});

export const ReleasePayloadSchema = z.object({
  id: z.string(),
  'dry-run': z.boolean().optional(),
  release: z.object({
    compatibility: ModuleCompatibilitySchema,
    manifest: z.string(),
    notes: z.string(),
    version: z.string(),
  }),
});

export const ReleaseStatusSchema = z.enum(['success', 'error']);

export const ReleaseErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const ReleaseSuccessResponseSchema = z.object({
  status: z.literal(ReleaseStatusSchema.enum.success),
  page: z.string(),
  message: z.string().optional(),
});

export const ReleaseErrorResponseSchema = z.object({
  status: z.literal(ReleaseStatusSchema.enum.error),
  errors: z
    .object({
      __all__: z.array(ReleaseErrorSchema).optional(),
      manifest: z.array(ReleaseErrorSchema).optional(),
    })
    .optional(),
});

export const ReleaseResponseSchema = z.union([
  ReleaseSuccessResponseSchema,
  ReleaseErrorResponseSchema,
]);

export type Env = z.infer<typeof EnvSchema>;
export type ReleasePayload = z.infer<typeof ReleasePayloadSchema>;
export type ReleaseResponse = z.infer<typeof ReleaseResponseSchema>;
