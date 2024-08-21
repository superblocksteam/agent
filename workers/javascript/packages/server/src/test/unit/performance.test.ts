import { describe, expect, it } from '@jest/globals';
import { default as pino } from 'pino';
import { StepPerformanceImpl } from '../../performance/step';
import { StepPerformance } from '../../performance/types';
import { micros, observe } from '../../performance/utils';

const _logger = pino({ level: 'debug' });

describe('micros', () => {
  it('to have millisecond precision if not trusted', async () => {
    expect(micros(false) % 1000).toBe(0);
  });
  it('to have microsecond precision if trusted', async () => {
    expect(micros() % 1000).toBeGreaterThan(0);
    expect(micros(true) % 1000).toBeGreaterThan(0);
  });
});

describe('observe', () => {
  it('should work', async () => {
    const perf: StepPerformance = new StepPerformanceImpl();

    await expect(observe<number>(_logger, perf.total, async (): Promise<number> => 5)).resolves.toEqual(5);
    expect(perf.total.value).toBeGreaterThan(0);
    perf.total.value = undefined; // reset

    await expect(
      observe<number>(_logger, perf.total, async (): Promise<number> => {
        throw Error('hi');
      })
    ).rejects.toThrow();
    expect(perf.total.value).toBeGreaterThan(0);
  });
});

describe('step overhead', () => {
  it('should work', async () => {
    expect(new StepPerformanceImpl({ pluginExecution: { value: 100 }, total: { value: 110 } }).overhead()).toEqual({
      absolute: 10,
      percentage: 0.1
    });
    expect(isNaN(new StepPerformanceImpl({ total: { value: 110 } }).overhead().absolute)).toBeTruthy();
    expect(isNaN(new StepPerformanceImpl({ total: { value: 110 } }).overhead().percentage)).toBeTruthy();
  });
});

describe('step merge', () => {
  it('should work', async () => {
    expect(new StepPerformanceImpl().merge(undefined)).toEqual(new StepPerformanceImpl());
  });
});

describe('step process', () => {
  it('should work', async () => {
    expect(new StepPerformanceImpl({ total: { start: 100, end: 90, value: 10 } }).process()).toEqual(
      new StepPerformanceImpl({ total: { start: 100, end: 90, value: 10 } })
    );
  });
});

describe('step bytes', () => {
  it('should work', async () => {
    expect(new StepPerformanceImpl({ kvStoreFetch: { bytes: 100 }, kvStorePush: { bytes: 50 } }).bytes()).toEqual(150);
    expect(new StepPerformanceImpl({ kvStoreFetch: { bytes: 100 } }).bytes()).toEqual(100);
    expect(new StepPerformanceImpl({ kvStoreFetch: { bytes: 100 }, kvStorePush: { bytes: 50 }, total: { bytes: 200 } }).bytes()).toEqual(
      150
    );
  });
});
