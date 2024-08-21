import { Histogram } from 'prom-client';
import { observe } from './metrics';

describe('observe', () => {
  it('only executes obeserved functions once', async () => {
    const mockFn_1 = jest.fn();
    const promHistogram = new Histogram({ name: 'foo', help: 'bar' });
    const mockFn_2 = jest.fn();
    promHistogram.observe = mockFn_2;
    await observe(promHistogram, {}, mockFn_1);
    expect(mockFn_1.mock.calls).toHaveLength(1);
    expect(mockFn_2.mock.calls).toHaveLength(1);

    const mockFn_3 = jest.fn();
    const mockFn_4 = jest.fn();
    await observe({ record: mockFn_4 }, {}, mockFn_3);
    expect(mockFn_3.mock.calls).toHaveLength(1);
    expect(mockFn_4.mock.calls).toHaveLength(1);
  });
});
