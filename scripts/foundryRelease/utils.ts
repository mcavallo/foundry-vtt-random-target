import type { ModuleJson } from '#/scripts/lib/schemas';
import type { ReleasePayload } from './schemas';

/**
 * Masks a token.
 */
export const maskToken = (token?: string) => {
  if (!token) {
    return 'unknown';
  }

  return token.replace(
    /^(.{6})(.+)(.{6})$/gi,
    (_match, p1, p2, p3) => `${p1}${'*'.repeat(p2.length)}${p3}`
  );
};

/**
 * Returns a release payload.
 */
export const makeReleasePayload = (moduleJson: ModuleJson): ReleasePayload => ({
  id: moduleJson.id,
  release: {
    compatibility: moduleJson.compatibility,
    manifest: moduleJson.manifest,
    notes: `${moduleJson.url}/releases/tag/v${moduleJson.version}`,
    // version: moduleJson.version,
    version: '4.6.3',
  },
});
