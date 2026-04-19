import { defineConfig } from '@mcavallo/foundry-build';

export default defineConfig({
  bundle: {
    entry: 'src/module.ts',
  },
  resources: {
    assets: 'src/assets',
    languages: 'src/lang',
    license: 'LICENSE',
    packs: 'src/packs',
    templates: 'src/templates',
  },
});
