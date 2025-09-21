import path from 'node:path';
import { copy } from 'fs-extra';
import type { ScriptContext } from '../../types/scripts';

const copyResources = async ({ ctx }: { ctx: ScriptContext }) => {
  console.log(`Copying resources...`);

  const resourcesList = [
    {
      from: path.join(ctx.sourceDir, 'templates'),
      to: path.join(ctx.distDir, 'templates'),
    },
    {
      from: path.join(ctx.sourceDir, 'assets'),
      to: path.join(ctx.distDir, 'assets'),
    },
    {
      from: path.join(ctx.sourceDir, 'lang'),
      to: path.join(ctx.distDir, 'lang'),
    },
    {
      from: path.join(ctx.rootDir, 'LICENSE'),
      to: path.join(ctx.distDir, 'LICENSE'),
    },
  ];

  for (const resource of resourcesList) {
    console.log(`Copying '${resource.from}'...`);
    await copy(resource.from, resource.to);
  }
};

export default copyResources;
