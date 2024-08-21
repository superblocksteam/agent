// https://snippets.bentasker.co.uk/page-1907020841-Calculating-Mean,-Median,-Mode,-Range-and-Percentiles-with-Javascript-Javascript.html
export const percentile = (q: number, arr: Array<number>): number => {
  const a = arr.slice();
  // Turn q into a decimal (e.g. 95 becomes 0.95)
  q = q / 100;

  // Sort the array into ascending order
  const data = a;

  // Work out the position in the array of the percentile point
  const p = (data.length - 1) * q;
  const b = Math.floor(p);

  // Work out what we rounded off (if anything)
  const remainder = p - b;

  // See whether that data exists directly
  if (data[b + 1] !== undefined) {
    return data[b] + remainder * (data[b + 1] - data[b]);
  } else {
    return data[b];
  }
};

export const withJitter = (min, max): number => Math.floor(Math.random() * (max - min + 1) + min);

import { Span, SpanKind, SpanStatusCode, Tracer } from '@opentelemetry/api';
import { Logger } from 'pino';
import { RedisMessage } from './types';

export function isKVStoreTx(x: unknown): boolean {
  if (typeof x !== 'object') {
    return false;
  }

  return 'commit' in x;
}

/**
 * Unpacks and flattens
 *
 *  [
 *    { messages: [{ id: 'stream_one, message: { one: "hi" } }] },
 *    { messages: [{ id: 'stream_two, message: { two: "hi" } }] },
 *    { messages: [{ id: 'stream_six, message: { six: "hi" } }] }
 *  ]
 *
 * @param data    The raw message from Redis.
 * @param logger  Optional logger to use.
 * @returns       A flattened view of all parsed messages.
 */
export function unpack(data: unknown, logger?: Logger): RedisMessage[] {
  if (!Array.isArray(data)) {
    throw Error('data must be array');
  }

  const arr = data as Array<unknown>;

  if (arr.length < 1) {
    throw Error('redis response is malformed');
  }

  return arr
    .map((stream: unknown, streamIdx: number): Array<RedisMessage> => {
      if (
        // 1. It must be an object.
        typeof stream !== 'object' ||
        // 2. It must contain a messages property.
        !('messages' in (stream as object)) ||
        // 3. The messages property must be an array.
        !Array.isArray(stream['messages']) ||
        // 4. The aformentioned array must have at least 1 item.
        stream['messages'].length < 1
      ) {
        throw Error('redis response is malformed');
      }
      return stream['messages'].map((msg: unknown, idx: number): RedisMessage => {
        const validated: RedisMessage = {
          id: '',
          message: {},
          idx: streamIdx
        };

        if (typeof msg !== 'object') {
          throw Error(`message ${idx} is malformed: must be an object`);
        }

        if (!('id' in msg)) {
          throw Error(`message ${idx} is malformed: id property is required`);
        }

        if (!('message' in msg) || typeof msg['message'] !== 'object') {
          throw Error(`message ${idx} is malformed: message property must be an object`);
        }

        if (typeof msg['id'] === 'string') {
          validated.id = msg['id'] as string;
        } else if (Buffer.isBuffer(msg['id'])) {
          validated.id = (msg['id'] as Buffer).toString();
        } else {
          throw Error(`message ${idx} is malformed: id must be a string`);
        }

        Object.keys(msg['message']).forEach((val: unknown, idx: number): void => {
          if (typeof val !== 'string') {
            throw Error(`key ${idx} is malformed: must be a string`);
          }
          if (Buffer.isBuffer(msg['message'][val])) {
            msg['message'][val] = (msg['message'][val] as Buffer).toString();
          } else if (typeof msg['message'][val] !== 'string') {
            throw Error(`message ${idx} is malformed: field ${val} must be a string or Buffer`);
          }
        });

        // @ts-ignore
        validated.message = msg['message'];

        return validated;
      });
    })
    .flat();
}

/**
 * Deep check if object has string values include the pattern string
 * @param obj    Object
 * @param p      Pattern string
 * @param level  Recursion level
 */
export const deepContains = (obj: object, p: string, level = 0) => {
  if (level === 1000) {
    throw new Error(`Object nested level is greater than 1000`);
  }
  if (obj === null || obj === undefined) {
    return false;
  }
  return Object.values(obj).some((v) => {
    switch (typeof v) {
      case 'string':
        return v.includes(p);
      case 'object':
        return deepContains(v, p, level + 1);
      default:
        return false;
    }
  });
};

export async function spanned<T>(
  tracer: Tracer,
  name: string,
  kind: SpanKind,
  fn: () => Promise<T>,
  attributes: Record<string, string> = {}
): Promise<T> {
  return await tracer.startActiveSpan(name, { kind, attributes }, async (span: Span): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
