import { Result, ResultAsync, err, ok, okAsync } from 'neverthrow';

/**
 * Thunk that returns a ResultAsync.
 */
export type Task<T, E> = () => ResultAsync<T, E>;

/**
 * Object containing the context and optionally a value
 */
export type CtxAndValue<C, V = never> = [V] extends [never]
  ? { ctx: C }
  : { ctx: C; value: V };

/**
 * Run tasks sequentially and collect all results (Ok or Err).
 * Each task is a thunk so execution is lazy until sequenceAll is called.
 */
export const sequenceAll = <T, E>(
  tasks: Task<T, E>[]
): ResultAsync<Result<T, E>[], never> =>
  tasks.reduce(
    (acc: ResultAsync<Result<T, E>[], never>, task) =>
      acc.andThen((results) =>
        task()
          .map<Result<T, E>[]>((res) => [...results, ok<T, E>(res)])
          .orElse((error) =>
            ResultAsync.fromSafePromise(
              Promise.resolve([...results, err<T, E>(error)])
            )
          )
      ),
    ResultAsync.fromSafePromise<Result<T, E>[], never>(Promise.resolve([]))
  );

/**
 * Creates a CtxAndValue object.
 */
export function ctxAndValue<C, V = never>(
  ctx: C,
  ...rest: [V] extends [never] ? [] : [V]
): CtxAndValue<C, V> {
  return rest.length === 0
    ? ({ ctx } as CtxAndValue<C, V>)
    : ({ ctx, value: rest[0] } as CtxAndValue<C, V>);
}

/**
 * Creates a ResultAsync wrapping a CtxAndValue object.
 */
export function okWithCtxAsync<C, V = never>(
  ctx: C,
  ...rest: [V] extends [never] ? [] : [V]
): ResultAsync<CtxAndValue<C, V>, never> {
  return okAsync(ctxAndValue(ctx, ...rest));
}
