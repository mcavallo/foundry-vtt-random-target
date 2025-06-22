import type { EnvSchema, PackageSchema } from '../scripts/lib/schemas.ts';

export interface ScriptContext {
  distDir: string;
  env: EnvSchema;
  packageJson: PackageSchema;
  rootDir: string;
  sourceDir: string;
}

export interface BuildArtifactsDict {
  esmodules: string[];
  scripts: string[];
  styles: string[];
}

export type ArtifactType = 'script' | 'esmodule' | 'style' | 'other';

export interface ReleaseData {
  isReleaseBuild: boolean;
  release: string;
  version: string;
}

export interface BundleConfig {
  naming: string;
  sourcemap: 'none' | 'linked' | 'external' | 'inline';
  minify: boolean;
}
