import { describe, expect, it } from '@jest/globals';
import { unpack, isKVStoreTx } from '../../utils';

describe('isKVStoreTx', () => {
  it('should work', () => {
    expect(isKVStoreTx(5)).toBeFalsy();
    expect(isKVStoreTx('hi')).toBeFalsy();
    expect(isKVStoreTx({})).toBeFalsy();
    expect(isKVStoreTx({ foo: 'bar' })).toBeFalsy();

    expect(isKVStoreTx({ commit: 'bar' })).toBeTruthy();
    expect(
      isKVStoreTx({
        commit: () => {
          return 5;
        }
      })
    ).toBeTruthy();
  });
});

describe('unpack', () => {
  it('malformed', () => {
    expect(() => unpack({})).toThrow(Error);
    expect(() => unpack(5)).toThrow(Error);
    expect(() => unpack('hi')).toThrow(Error);

    expect(() => unpack(unpack([{ messages: [{ id: 'abc123' }] }]))).toThrow(Error);
    expect(() => unpack(unpack([{ messages: [{ id: 'abc123', message: 5 }] }]))).toThrow(Error);
    expect(() => unpack(unpack([{ messages: [{ id: 5, message: {} }] }]))).toThrow(Error);
    expect(() =>
      unpack(
        unpack([
          {
            messages: [
              { id: 'abc123', message: {} },
              { id: 'def456', message: 5 }
            ]
          }
        ])
      )
    ).toThrow(Error);
  });

  it('multiple streams', () => {
    expect(
      unpack([
        {
          messages: [{ id: 'abc123', message: { foo: Buffer.from('bar'), frank: 'greco' } }]
        },
        {
          messages: [{ id: 'def456', message: { frank: 'greco' } }]
        }
      ])
    ).toStrictEqual([
      { id: 'abc123', message: { foo: 'bar', frank: 'greco' }, idx: 0 },
      { id: 'def456', message: { frank: 'greco' }, idx: 1 }
    ]);
  });

  it('happy path', () => {
    expect(unpack([{ messages: [{ id: 'abc123', message: {} }] }])).toStrictEqual([{ id: 'abc123', message: {}, idx: 0 }]);
    expect(unpack([{ messages: [{ id: 'abc123', message: { foo: Buffer.from('bar') } }] }])).toStrictEqual([
      { id: 'abc123', message: { foo: 'bar' }, idx: 0 }
    ]);
    expect(unpack([{ messages: [{ id: Buffer.from('abc123'), message: {} }] }])).toStrictEqual([{ id: 'abc123', message: {}, idx: 0 }]);
    expect(unpack([{ messages: [{ id: 'abc123', message: { foo: Buffer.from('bar'), frank: 'greco' } }] }])).toStrictEqual([
      { id: 'abc123', message: { foo: 'bar', frank: 'greco' }, idx: 0 }
    ]);
    expect(
      unpack([
        {
          messages: [
            { id: 'abc123', message: { foo: Buffer.from('bar'), frank: 'greco' } },
            { id: Buffer.from('def456'), message: { frank: 'greco' } },
            { id: Buffer.from('ghi789'), message: { frank: Buffer.from('greco'), cheng: Buffer.from('tan') } }
          ]
        }
      ])
    ).toStrictEqual([
      { id: 'abc123', message: { foo: 'bar', frank: 'greco' }, idx: 0 },
      { id: 'def456', message: { frank: 'greco' }, idx: 0 },
      { id: 'ghi789', message: { frank: 'greco', cheng: 'tan' }, idx: 0 }
    ]);
  });
});
