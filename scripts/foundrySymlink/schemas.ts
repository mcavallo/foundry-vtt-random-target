import { z } from 'zod';

export const FoundrySymlinkEnvSchema = z.object({
  FOUNDRY_DATA_PATH: z.string(),
});

export const CommandEnumSchema = z.enum(['link', 'unlink']);

export const FoundrySymlinkArgsSchema = z.object({
  _: z.tuple([CommandEnumSchema]),
});

export type FoundrySymlinkEnv = z.infer<typeof FoundrySymlinkEnvSchema>;
export type FoundrySymlinkArgs = z.infer<typeof FoundrySymlinkArgsSchema>;

export type CommandEnum = z.infer<typeof CommandEnumSchema>;
