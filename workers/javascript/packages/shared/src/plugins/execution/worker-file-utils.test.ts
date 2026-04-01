import { prepareGlobalsWithFileMethods } from './worker-file-utils';
import type { FileFetcher } from './types';

describe('prepareGlobalsWithFileMethods', () => {
  const identity = <T extends (...args: unknown[]) => unknown>(fn: T) => fn;

  it('skips entries with empty diskPath', () => {
    const globals: Record<string, unknown> = {};
    prepareGlobalsWithFileMethods(globals, { 'file1': '' }, { type: 'controller', fileServerUrl: 'http://test', agentKey: 'key' }, identity);
    expect(globals).toEqual({});
  });

  it('attaches readContents and readContentsAsync for controller fetcher', () => {
    const globals: Record<string, unknown> = { myFile: { $superblocksId: '123' } };
    const fetcher: FileFetcher = { type: 'controller', fileServerUrl: 'http://test/v1/files', agentKey: 'key' };

    prepareGlobalsWithFileMethods(globals, { myFile: '/tmp/file.txt' }, fetcher, identity);

    const file = globals.myFile as Record<string, unknown>;
    expect(typeof file.readContents).toBe('function');
    expect(typeof file.readContentsAsync).toBe('function');
    expect(file.$superblocksId).toBe('123');
    expect(file.previewUrl).toBeUndefined();
  });

  it('attaches readContents and readContentsAsync for sandbox fetcher', () => {
    const globals: Record<string, unknown> = { myFile: {} };
    const fetcher: FileFetcher = {
      type: 'sandbox',
      client: { fetchFileCallback: jest.fn() }
    };

    prepareGlobalsWithFileMethods(globals, { myFile: '/tmp/file.txt' }, fetcher, identity);

    const file = globals.myFile as Record<string, unknown>;
    expect(typeof file.readContents).toBe('function');
    expect(typeof file.readContentsAsync).toBe('function');
  });

  it('handles nested paths via lodash get/set', () => {
    const globals: Record<string, unknown> = { a: { b: { existing: true } } };
    const fetcher: FileFetcher = { type: 'controller', fileServerUrl: 'http://test', agentKey: 'key' };

    prepareGlobalsWithFileMethods(globals, { 'a.b': '/tmp/nested.txt' }, fetcher, identity);

    const nested = (globals.a as Record<string, unknown>).b as Record<string, unknown>;
    expect(nested.existing).toBe(true);
    expect(typeof nested.readContents).toBe('function');
  });

  it('applies wrapHostFn to readContents and readContentsAsync', () => {
    const wrapped = Symbol('wrapped');
    const wrapHostFn = jest.fn().mockReturnValue(wrapped);
    const globals: Record<string, unknown> = { f: {} };
    const fetcher: FileFetcher = { type: 'controller', fileServerUrl: 'http://test', agentKey: 'key' };

    prepareGlobalsWithFileMethods(globals, { f: '/tmp/f.txt' }, fetcher, wrapHostFn);

    expect(wrapHostFn).toHaveBeenCalledTimes(2);
    const file = globals.f as Record<string, unknown>;
    expect(file.readContents).toBe(wrapped);
    expect(file.readContentsAsync).toBe(wrapped);
  });

  it('handles multiple files', () => {
    const globals: Record<string, unknown> = { a: {}, b: {} };
    const fetcher: FileFetcher = { type: 'controller', fileServerUrl: 'http://test', agentKey: 'key' };

    prepareGlobalsWithFileMethods(globals, { a: '/tmp/a.txt', b: '/tmp/b.txt' }, fetcher, identity);

    expect(typeof (globals.a as Record<string, unknown>).readContents).toBe('function');
    expect(typeof (globals.b as Record<string, unknown>).readContents).toBe('function');
  });
});
