import { IntegrationError } from '@superblocks/shared';

export type ErrorEncoding = {
  name: string;
  message: string;
};

export class AuthenticationError extends Error {
  constructor(msg: string) {
    super(`UNAUTHORIZED: ${msg}`);
  }
}

export class QuotaError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'QuotaError';
  }
}

export class DurationQuotaError extends QuotaError {
  constructor(msg?: string) {
    super(msg);
    this.name = 'DurationQuotaError';
  }
}

export function marshal(err: Error): ErrorEncoding {
  return {
    name: err.name,
    message: err.message
  };
}

// extend to all of our plugin error types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unmarshal(err?: ErrorEncoding): Error {
  if (!err) {
    return new Error();
  }

  // NOTE(frank): Very interesting. It would seem socket.io only does an
  //              implicit JSON.parse when a Javascript client is used.
  //              I thought it was done serverside so a little confused as
  //              to why since the client can also be Python, we might need
  //              to do an explicit JSON.parse.
  if (typeof err === 'string' || err instanceof String) {
    err = JSON.parse(err as unknown as string);
  }

  const msg: string = err?.message || '';

  switch (err?.name) {
    case IntegrationError.name:
      return new IntegrationError(msg);
    default:
      return new Error(msg);
  }
}

export class TimeoutError extends Error {
  constructor(msg?: string) {
    msg ? super(`[TIMEOUT] ${msg}`) : super();
  }
}

export class InternalError extends Error {
  constructor(msg?: string) {
    msg ? super(`[INTERNAL] ${msg}`) : super();
  }
}
