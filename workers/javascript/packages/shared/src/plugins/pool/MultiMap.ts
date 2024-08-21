/**
 * Similar to Map<K, V> except that every key can have multiple distinct values
 * associated with it
 */
export class MultiMap<K, V> {
  // invariant: the values in this Map are nonempty sets
  private readonly map = new Map<K, Set<V>>();

  clear(): void {
    this.map.clear();
  }

  /**
   * Find the "oldest" value associated with the given key and return it while also removing it from the map
   * @param key The key
   * @returns The value or undefined if no value is associated with the key
   */
  extractOne(key: K): V | undefined {
    const values = this.map.get(key);
    if (!values) return;
    // sets are iterated in insertion order
    for (const value of values) {
      // we found a value, let's remove it first and then return it
      if (values.size === 1) {
        this.map.delete(key);
      } else {
        values.delete(value);
      }
      return value;
    }
  }

  /** Find the number of values associated with the given key */
  getCount(key: K): number {
    return this.map.get(key)?.size ?? 0;
  }

  add(key: K, value: V): this {
    const values = this.map.get(key);
    if (values) {
      values.add(value);
    } else {
      this.map.set(key, new Set([value]));
    }
    return this;
  }

  delete(key: K, value: V): boolean {
    const values = this.map.get(key);
    if (!values || !values.delete(value)) {
      return false;
    } else {
      if (values.size === 0) {
        this.map.delete(key);
      }
      return true;
    }
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (const [key, values] of this.map) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }
}
