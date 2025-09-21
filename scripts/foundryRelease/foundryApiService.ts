import { ResultAsync, errAsync, fromPromise } from 'neverthrow';
import { piped } from 'remeda';
import z from 'zod';
import {
  InvalidResponseJsonError,
  InvalidResponseSchemaError,
  RequestError,
  ResponseError,
} from '#/scripts/lib/errors';
import { tryParseValueWithSchema } from '#/scripts/lib/safeUtils';
import { getErrorMessage } from '#/scripts/lib/utils';
import { type ReleasePayload, ReleaseResponseSchema } from './schemas';

export class FoundryApiService {
  static readonly BASE_URL = `https://foundryvtt.com/_api`;
  constructor(private releaseToken: string) {}

  protected post<Z extends z.ZodTypeAny = z.ZodNever>(
    schema: Z,
    endpoint: string,
    body: unknown
  ): ResultAsync<
    z.infer<Z>,
    RequestError | ResponseError | InvalidResponseSchemaError
  > {
    const fullEndpointUrl = `${FoundryApiService.BASE_URL}${endpoint}`;
    return fromPromise(
      fetch(fullEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.releaseToken,
        },
        body: JSON.stringify(body),
      }),
      piped(getErrorMessage, (message) => new RequestError(message))
    )
      .andThen((res) =>
        res.ok
          ? fromPromise(
              res.json(),
              piped(
                getErrorMessage,
                (message) => new InvalidResponseJsonError(message)
              )
            )
          : errAsync(new ResponseError(`POST ${fullEndpointUrl} failed`, res))
      )
      .andThen((data) =>
        tryParseValueWithSchema(schema, data).mapErr(
          (err) => new InvalidResponseSchemaError(err.zodError)
        )
      );
  }

  releasePackage(payload: ReleasePayload, isDryRun: boolean = false) {
    return this.post(
      ReleaseResponseSchema,
      '/packages/release_version/',
      Object.assign({}, payload, isDryRun ? { 'dry-run': true } : {})
    );
  }
}
