import type { CommandEnum } from '#/scripts/foundrySymlink/schemas';
import type { Logger } from '#/scripts/lib/logger';

export interface FoundrySymlinkContext {
  command: CommandEnum;
  distDir: string;
  foundryModulesDir: string;
  linkTargetDir: string;
  logger: Logger;
  rootDir: string;
  moduleId: string;
}
