import { InvalidConfigurationError } from '../errors';
import { EnvStore } from './env';

describe('env store', () => {
  test('errors when variable not set', () => {
    const envStore = new EnvStore({
      test1: 'value1'
    });
    expect(() => {
      envStore.add({ name: 'test2' });
    }).toThrowError(InvalidConfigurationError);
    expect(() => {
      envStore.addAll([{ name: 'test2' }, { name: 'test3', defaultValue: 'foo' }]);
    }).toThrowError(InvalidConfigurationError);
  });

  test('can fetch value', () => {
    const envStore = new EnvStore({
      test1: 'value1',
      test2: 'value2'
    });
    envStore.add({ name: 'test1' });
    envStore.addAll([{ name: 'test2' }, { name: 'test3', defaultValue: 'value3' }]);
    expect(envStore.get('test1')).toBe('value1');
    expect(envStore.get('test2')).toBe('value2');
    expect(envStore.get('test3')).toBe('value3');
  });

  test('errors when fetching value if not added', () => {
    const envStore = new EnvStore({
      test1: 'value1',
      test2: 'value2'
    });
    envStore.add({ name: 'test1' });
    expect(() => {
      envStore.get('test2');
    }).toThrowError(InvalidConfigurationError);
  });

  test('errors when fetching value if not added', () => {
    const envStore = new EnvStore({
      test1: 'value1',
      test2: 'value2'
    });
    envStore.add({ name: 'test', regex: 'test.*', defaultValue: {} });
    expect(envStore.get('test')).toEqual({ test1: 'value1', test2: 'value2' });
  });
});
