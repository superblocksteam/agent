import { describe, expect, test } from '@jest/globals';
import { withJitter } from './utils';

describe.each([
  [500, 600],
  [1, 1]
])('withJitter', (min, max) => {
  test('default', () => {
    const value: number = withJitter(min, max);

    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  });
});
