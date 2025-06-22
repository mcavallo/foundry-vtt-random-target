import { makeReleasePayload, maskToken, printRequestErrors, safeSendRequest } from '#/scripts/foundry/utils.ts';
import fs from 'fs-extra';
import path from 'node:path';

const run = async () => {
  if (!Bun.env.FOUNDRY_RELEASE_TOKEN) {
    throw new Error('Foundry token is missing');
  }

  const moduleJsonPath = path.resolve(process.cwd(), 'dist/module.json');
  const moduleJson = await fs.readJson(moduleJsonPath);

  console.log(
    `\nReleasing '%s' using token '%s'...`,
    moduleJson.name,
    maskToken(Bun.env.FOUNDRY_RELEASE_TOKEN)
  );

  const payload = makeReleasePayload(moduleJson);

  console.log(`\nSending dry run request...`);
  const dryRun = await safeSendRequest({
    payload,
    isDryRun: true,
    token: Bun.env.FOUNDRY_RELEASE_TOKEN,
  });

  if (dryRun.isErr()) {
    printRequestErrors(dryRun.error.response);
    throw new Error(`Failed to send dry run request to Foundry API.`);
  }

  console.log(`\nSending request...`);
  const release = await safeSendRequest({
    payload,
    isDryRun: false,
    token: Bun.env.FOUNDRY_RELEASE_TOKEN,
  });

  if (release.isErr()) {
    printRequestErrors(release.error.response);
    throw new Error(`Failed to send request to Foundry API.`);
  }

  console.log(`\nRelease OK.`);
};

run();
