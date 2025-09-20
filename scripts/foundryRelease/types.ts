import type { Logger } from '#/scripts/lib/logger';
import type { FoundryApiService } from './foundryApiService';
import type { ReleasePayload } from './schemas';

export interface FoundryReleaseContext {
  api: FoundryApiService;
  distDir: string;
  releasePayload: ReleasePayload;
  releaseToken: string;
  logger: Logger;
}
