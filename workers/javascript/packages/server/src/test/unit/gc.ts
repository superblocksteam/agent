import { describe, expect, it } from '@jest/globals';
import { MockKVStore } from 'src/store/mock';
import { GC } from '../../store/gc';

describe('micros', () => {
  it('to have millisecond precision if not trusted', async () => {
    const store = new MockKVStore();
    await store.writeMany([
      { key: 'key-1', value: {} },
      { key: 'key-2', value: {} },
      { key: 'key-3', value: {} },
      { key: 'key-4', value: {} }
    ]);
    const gc = new GC();
    gc.record('key-1');
    gc.record('key-2');
    gc.record(['key-3', 'ley-4']);
    await gc.run(store);

    expect(await store.read(['key-1', 'key-2', 'key-3', 'key-4'])).toBe([null, null, null, null]);
  });
});
