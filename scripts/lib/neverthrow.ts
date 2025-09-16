import { Result, ResultAsync, err, ok } from 'neverthrow';

export type Task<T, E> = () => ResultAsync<T, E>;

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
