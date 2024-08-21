import { describe, expect, it } from '@jest/globals';
import { load, unmarshalExcludableList, sort } from './plugin';

describe('unmarshal', () => {
  it('should correctly create request using includes', () => {
    expect(unmarshalExcludableList('one,two')).toEqual({
      exclude: false,
      items: ['one', 'two']
    });
  });

  it('should correctly create request using excludes', () => {
    expect(unmarshalExcludableList('!one,two')).toEqual({
      exclude: true,
      items: ['one', 'two']
    });
  });

  it('should correctly handle the default case', () => {
    expect(unmarshalExcludableList('')).toEqual({});
  });

  it('should correctly handle malformed', () => {
    expect(unmarshalExcludableList('!')).toEqual({});
  });
});

describe('load', () => {
  it('should correctly load plugins', () => {
    expect(
      load({
        'sb-one': 'foo',
        'sb-two': 'bar'
      })
    ).toEqual([{ name: 'one' }, { name: 'two' }]);
  });

  it('should treat everything after sb- prefix as package name', () => {
    expect(
      load({
        'sb-one': 'foo',
        'sb-one-0.0.1': 'foo',
        'sb-one-0.0.5': 'foo',
        'sb-two-0.0.1': 'foo',
        'sb-two-0.0.3': 'foo'
      }).sort(sort)
    ).toEqual([{ name: 'one' }, { name: 'one-0.0.1' }, { name: 'one-0.0.5' }, { name: 'two-0.0.1' }, { name: 'two-0.0.3' }].sort(sort));
  });

  it('should accept plugins with dashes in them', () => {
    expect(
      load({
        'sb-ping-pong': 'foo'
      }).sort(sort)
    ).toEqual([{ name: 'ping-pong' }]);
  });

  it('should correctly handle no deps', () => {
    expect(load({})).toEqual([]);
  });

  it('should correctly handle no plugins', () => {
    expect(
      load({
        foo: 'bar'
      })
    ).toEqual([]);
  });

  it('should correctly handle incorrect plugins', () => {
    expect(
      load({
        foo: 'bar',
        'sb-one': 'bar',
        'sb-one-two-three': 'bar'
      })
    ).toEqual([{ name: 'one' }, { name: 'one-two-three' }]);
  });
});
