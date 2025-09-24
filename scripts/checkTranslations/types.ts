import type { Logger } from '#/scripts/lib/logger';
import defaultTranslationsFile from '@/lang/en.json';

export type TranslationFile = {
  paths: string[];
  json: typeof defaultTranslationsFile;
};

export type TranslationPathWithErrors = [string, string[] | null];

export interface CheckTranslationsContext {
  langDir: string;
  logger: Logger;
  baseTranslation: TranslationFile;
}
