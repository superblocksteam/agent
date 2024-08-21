import { IntegrationError } from '@superblocks/shared';
import { Logger } from 'pino';
import { Observable } from './types';

export async function observe<T>(logger: Logger, obs: Observable, fn: () => Promise<T>): Promise<T> {
  obs.start = obs.start || micros();

  try {
    return await fn();
  } catch (e) {
    // log metrics
    if (e instanceof IntegrationError) {
      const _logger = logger.child({
        subject: e.name,
        event: 'observe',
        code: e.code,
        internalCode: JSON.stringify(e.internalCode),
        clientCode: e.internalCode?.code,
        stack: e.internalCode?.stack
      });
      _logger.error(e.message);
    }
    throw e;
  } finally {
    obs.end = micros();
    obs.value = obs.end - obs.start;
  }
}

export function elapsed(...obs: Observable[]): void {
  obs.forEach((obs: Observable): void => {
    if (!obs.value && obs.end && obs.start) {
      obs.value = obs.end - obs.start;
    }
  });
}

export function clear(...obs: Observable[]): void {
  obs.forEach((obs: Observable): void => {
    obs = {};
  });
}

/**
 * NOTE: {@link process.hrtime} cannot be trusted between processes.
 * @param trust
 * @returns
 */
export function micros(trust = true): number {
  if (trust) {
    return Number(process.hrtime.bigint()) / 1000;
  }
  return Date.now() * 1000;
}

export function millis(trust = true): number {
  return micros(trust) / 1000;
}
