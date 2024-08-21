import { truncatedJsonStringify } from './truncate';

describe('truncate json', () => {
  test('truncates if exceeds line limit', () => {
    const objToTruncate = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4',
      key5: 'value4',
      key6: 'value6',
      key7: 'value7',
      key8: 'value8',
      key9: 'value9'
    };
    // eslint-disable-next-line no-useless-escape
    const expected = `{\"key1\":\"value1\",\"key2\":\"value2\",\"key3\":<… TRUNCATED …>:\"value9\"}`;
    expect(truncatedJsonStringify(objToTruncate, 50)).toBe(expected);
  });

  test('does not truncate if under line limit', () => {
    const objToTruncate = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
      key4: 'value4',
      key5: 'value4',
      key6: 'value6',
      key7: 'value7',
      key8: 'value8',
      key9: 'value9'
    };
    expect(truncatedJsonStringify(objToTruncate, 200)).toBe(JSON.stringify(objToTruncate));
  });

  test('handles null and undefined', () => {
    expect(truncatedJsonStringify(undefined, 200)).toBe(undefined);
    expect(truncatedJsonStringify(null, 200)).toBe('null');
  });
});
