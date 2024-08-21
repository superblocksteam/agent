import { MultiMap } from './MultiMap';

describe('MultiMap', () => {
  test('basic adding/removing elements from a map', () => {
    const map = new MultiMap<string, number>();
    expect(map.getCount('test1')).toBe(0);
    map.add('test1', 0);
    expect(map.getCount('test1')).toBe(1);
    // add a duplicate value, should be ignored
    map.add('test1', 0);
    expect(map.getCount('test1')).toBe(1);
    map.add('test1', 1);
    expect(map.getCount('test1')).toBe(2);
    const r1 = map.extractOne('test1');
    expect(r1).toBe(0);
    expect(map.getCount('test1')).toBe(1);
    const r2 = map.extractOne('test1');
    expect(r2).toBe(1);
    const r3 = map.extractOne('test1');
    expect(map.getCount('test1')).toBe(0);
    expect(r3).toBeUndefined();
  });

  test('delete elements from a map', () => {
    const map = new MultiMap<string, number>();
    map.add('test1', 0);
    map.add('test1', 1);
    expect(map.getCount('test1')).toBe(2);
    const r1 = map.delete('test1', 1);
    expect(map.getCount('test1')).toBe(1);
    expect(r1).toBe(true);
    const r2 = map.delete('test1', 1);
    expect(map.getCount('test1')).toBe(1);
    expect(r2).toBe(false);
    const r3 = map.delete('test1', 0);
    expect(map.getCount('test1')).toBe(0);
    expect(r3).toBe(true);
  });

  test('basic traversal of a map', () => {
    const map = new MultiMap<string, number>();
    map.add('test2', 0);
    map.add('test1', 0);
    const items = [...map];
    expect(items).toStrictEqual([
      ['test2', 0],
      ['test1', 0]
    ]);
  });

  test('basic traversal of a map respects insertion order for each key', () => {
    const map = new MultiMap<string, number>();
    map.add('test1', 0);
    map.add('test1', 1);
    map.add('test1', 2);
    const items = [...map];
    expect(items).toStrictEqual([
      ['test1', 0],
      ['test1', 1],
      ['test1', 2]
    ]);
  });

  test('clear a map', () => {
    const map = new MultiMap<string, number>();
    map.add('test2', 0);
    map.add('test2', 1);
    map.add('test1', 0);
    expect([...map].length).toBe(3);
    map.clear();
    expect([...map].length).toBe(0);
  });
});
