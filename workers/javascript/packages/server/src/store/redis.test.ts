import { describe, test } from '@jest/globals';
import { WriteOps } from '../types';
import { RedisTx } from './redis';

describe.each([
  ['should throw if quota is violated', { value: Buffer.alloc(500) }, { maxSize: 1000 }, true],
  ['should not throw if quota is not violated', { value: Buffer.alloc(400) }, { maxSize: 1000 }, false],
  ['should not throw if not quota is provided', { value: Buffer.alloc(500) }, {}, false]
])('quota enforcement on size', (name: string, value: object, ops: WriteOps, throws: boolean) => {
  const client: RedisTx = new RedisTx({
    client: undefined,
    seconds: 1
  });

  test(name, () => {
    const fn = () => {
      client.write('key', value, ops);
    };

    if (throws) {
      expect(fn).toThrow(`This value's size (${Buffer.byteLength(JSON.stringify(value))}) has exceed the limit (${ops.maxSize}).`);
    } else {
      expect(fn).not.toThrowError();
    }
  });
});
