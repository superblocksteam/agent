import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('dotenv', () => ({
  __esModule: true,
  default: {
    config: jest.fn()
  }
}));

describe('SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST', () => {
  const envKey = 'SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST';
  let previous: string | undefined;

  beforeEach(() => {
    previous = process.env[envKey];
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
    if (previous === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = previous;
    }
  });

  it('defaults to an empty array when the variable is empty', async () => {
    process.env[envKey] = '';
    const { SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST } = await import('./env');
    expect(SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST).toEqual([]);
  });

  it('defaults to an empty array when the variable is not set', async () => {
    delete process.env[envKey];
    const { SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST } = await import('./env');
    expect(SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST).toEqual([]);
  });

  it('parses a comma-separated list of variable names', async () => {
    process.env[envKey] = 'FOO,BAR,BAZ';
    const { SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST } = await import('./env');
    expect(SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST).toEqual(['FOO', 'BAR', 'BAZ']);
  });

  it('trims whitespace around each name', async () => {
    process.env[envKey] = ' FOO , BAR ';
    const { SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST } = await import('./env');
    expect(SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST).toEqual(['FOO', 'BAR']);
  });

  it('drops empty segments from repeated or trailing commas', async () => {
    process.env[envKey] = 'FOO,,BAR,  ,';
    const { SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST } = await import('./env');
    expect(SUPERBLOCKS_WORKER_EXECUTION_ENV_INCLUSION_LIST).toEqual(['FOO', 'BAR']);
  });
});
