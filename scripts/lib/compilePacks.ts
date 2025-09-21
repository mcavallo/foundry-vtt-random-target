import path from 'node:path';
import { readdir } from 'fs-extra';
import yaml from 'js-yaml';
import type { ScriptContext } from '../../types/scripts';
import { fileExists } from './utils';

const compilePacks = async ({ ctx }: { ctx: ScriptContext }) => {
  console.log(`Compiling packs...`);

  const sourceDir = path.join(ctx.sourceDir, 'packs');
  const distDir = path.join(ctx.distDir, 'packs');
  const fileNames = await readdir(sourceDir);

  for (const fileName of fileNames) {
    const outputPath = path.join(distDir, path.parse(fileName).name + '.db');
    console.log(`Processing ${fileName}...`);

    const alreadyPresent = await fileExists(outputPath);

    // Foundry locks the .db files when running, so here's a workaround to mitigate
    // the errors while the dev server is running.
    if (alreadyPresent) {
      console.log(`${outputPath} already present. Skipping.`);
      return;
    }

    const contents = await Bun.file(path.join(sourceDir, fileName)).text();
    const doc = yaml.load(contents) as object[];
    const db = doc.reduce((acc, entry) => acc + `${JSON.stringify(entry)}\n`, '');
    await Bun.write(outputPath, db);
  }
};

export default compilePacks;
