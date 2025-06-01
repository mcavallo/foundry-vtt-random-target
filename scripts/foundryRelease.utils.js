import { fromPromise, okAsync } from 'neverthrow';

class ResponseException extends Error {
  constructor(response, status) {
    super();
    this.response = response;
    this.status = status;
  }
}

const identity = v => v;

export const makeReleasePayload = moduleJson => ({
  id: moduleJson.name,
  release: {
    version: moduleJson.version,
    manifest: moduleJson.manifest,
    notes: `${moduleJson.url}/releases/tag/v${moduleJson.version}`,
    compatibility: moduleJson.compatibility,
  },
});

export const printRequestErrors = response => {
  let parsedErrors = [];

  Object.entries(response.errors ?? {}).forEach(([key, value]) => {
    switch (key) {
      case '__all__':
        Array.from(value).forEach(error => {
          parsedErrors.push(error.message);
        });
        break;
      default:
        Array.from(value).forEach(error => {
          parsedErrors.push(`${key}: ${error.message}`);
        });
        break;
    }
  });

  if (parsedErrors.length > 0) {
    console.error(`\nFound ${parsedErrors.length} errors:`);
    parsedErrors.forEach(errorMessage => {
      console.error(errorMessage);
    });
  }
};

export const maskToken = token => {
  if (!token) {
    return 'unknown';
  }

  return token.replace(
    /^(.{6})(.+)(.{6})$/gi,
    (_match, p1, p2, p3) => `${p1}${'*'.repeat(p2.length)}${p3}`
  );
};

export const sendRequest = async ({ payload, isDryRun, token }) => {
  let body = Object.assign({}, payload);

  if (isDryRun) {
    body['dry-run'] = isDryRun;
  }

  const resp = await fetch(
    'https://api.foundryvtt.com/_api/packages/release_version/',
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  const jsonResponse = await fromPromise(resp.json(), identity).orElse(() =>
    okAsync({})
  );

  if (!jsonResponse.isOk()) {
    throw jsonResponse.error;
  }

  if (!resp.ok) {
    throw new ResponseException(jsonResponse.value, resp.status);
  }

  return jsonResponse;
};

export const safeSendRequest = ({ payload, isDryRun, token }) =>
  fromPromise(sendRequest({ payload, isDryRun, token }), err => err);
