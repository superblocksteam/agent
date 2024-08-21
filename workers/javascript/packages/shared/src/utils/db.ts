type ErrorWithCode = { code: string };
const hasErrorCode = (err: unknown): err is ErrorWithCode => (err as ErrorWithCode).code !== undefined;

const retryableErrorCodes = new Set(['40001']);

// Errors with these Postgres error codes indicate that the query failed because
// it conflicted with another transaction. This transaction needs to be retried
// by the client.
// Errors that are retryable will not be logged as errors since they are
// expected occur and to be retried by the client.
export const isRetryable = (err: unknown): boolean => {
  return hasErrorCode(err) && retryableErrorCodes.has(err.code);
};
