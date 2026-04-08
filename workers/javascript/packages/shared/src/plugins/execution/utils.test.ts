import { describe, expect, it, jest } from '@jest/globals';
import * as wasmSandbox from '@superblocks/wasm-sandbox-js';

import { ExecutionContext } from '../../types';
import { resolveAllBindings, serialize } from './utils';
import { VariableClientImpl } from './variable-client';
import * as vm from './vm';

class MockKVStore {
  private _store: { [key: string]: unknown } = {};
  fetchFileCallback?: (path: string, callback: (error: Error | null, result: Buffer | null) => void) => void;

  public async read(keys: string[]): Promise<{ data: unknown[] }> {
    const _matched: unknown[] = [];

    keys.forEach((item: string) => {
      _matched.push(this._store[item]);
    });

    return { data: _matched };
  }

  public async write(key: string, value: unknown): Promise<void> {
    this._store[key] = value;
  }

  public async writeMany(payload: { key: string; value: unknown }[]): Promise<void> {
    for (const { key, value } of payload) {
      this._store[key] = value;
    }
  }

  public async delete(keys: string[]): Promise<void> {
    for (const key of keys) {
      delete this._store[key];
    }
  }

  public async close(reason: string | undefined): Promise<void> {
    // do nothing
  }
}

describe('utils', () => {
  describe('resolveAllBindings', () => {
    it('should resolve a simple binding from globals', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('foo', 'bar');

      // resolving {{ foo }}
      // resolveAllBindings expects the input string containing mustache templates
      const result = await resolveAllBindings('{{ foo }}', context, {}, false);

      // The result keys are the expressions extracted from mustache tags.
      // If input is '{{ foo }}', the expression is 'foo'.
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should resolve multiple bindings', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('a', 1);
      context.addGlobalVariable('b', 2);

      const result = await resolveAllBindings('{{ a }} + {{ b }}', context, {}, false);

      expect(result).toEqual({
        a: 1,
        b: 2
      });
    });

    it('should resolve complex expressions', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('x', 10);

      const result = await resolveAllBindings('{{ x * 2 }}', context, {}, false);

      expect(result).toEqual({
        'x * 2': 20
      });
    });

    it('should handle array access', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('arr', [1, 2, 3]);

      const result = await resolveAllBindings('{{ arr[0] }}', context, {}, false);

      expect(result).toEqual({
        'arr[0]': 1
      });
    });

    it('should handle object access', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('obj', { key: 'value' });

      const result = await resolveAllBindings('{{ obj.key }}', context, {}, false);

      expect(result).toEqual({
        'obj.key': 'value'
      });
    });

    it('should have lodash available as _', async () => {
      const context = new ExecutionContext();
      const result = await resolveAllBindings('{{ _.isEmpty("test") }}', context, {}, false);
      expect(result['_.isEmpty("test")']).toEqual(false);
    });

    it('should use WASM when context.useWasmBindingsSandbox is true', async () => {
      const wasmSpy = jest.spyOn(wasmSandbox, 'createSandbox');
      const vmSpy = jest.spyOn(vm, 'nodeVMWithContext');
      try {
        const context = new ExecutionContext();
        context.kvStore = new MockKVStore();
        context.useWasmBindingsSandbox = true;
        context.addGlobalVariable('x', 2);

        const result = await resolveAllBindings('{{ x + 1 }}', context, {}, false);
        expect(result['x + 1']).toEqual(3);
        expect(wasmSpy).toHaveBeenCalled();
        expect(vmSpy).not.toHaveBeenCalled();
      } finally {
        wasmSpy.mockRestore();
        vmSpy.mockRestore();
      }
    });

    it('should not allow requiring restricted modules', async () => {
      const context = new ExecutionContext();
      // TODO: `fs` is still not blocked by the VM2 codepath because it is used internally. When this is fixed (or the VM2 codepath is removed),
      // we should re-enable the following tests.
      // await expect(resolveAllBindings('{{ require("fs") }}', context, {}, false)).rejects.toThrow();
      // await expect(resolveAllBindings('{{ require("node:fs") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("child_process") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("node:child_process") }}', context, {}, false)).rejects.toThrow();
    });

    it('should not expose $agentKey or $fileServerUrl in the WASM sandbox', async () => {
      const context = new ExecutionContext();
      context.useWasmBindingsSandbox = true;
      context.addGlobalVariable('$agentKey', 'super-secret-agent-key');
      context.addGlobalVariable('$fileServerUrl', 'http://example.invalid/v2/files');

      await expect(resolveAllBindings('{{ $agentKey }}', context, {}, false)).rejects.toThrow(/\$agentKey.*not defined/i);
      await expect(resolveAllBindings('{{ $fileServerUrl }}', context, {}, false)).rejects.toThrow(/\$fileServerUrl.*not defined/i);
    });

    it('should complete WASM binding resolution without kvStore when no variables or sandbox file fetcher', async () => {
      const context = new ExecutionContext();
      context.useWasmBindingsSandbox = true;
      context.addGlobalVariable('x', 42);
      // No kvStore, no variables, no file picker - useSandboxFileFetcher is false
      const result = await resolveAllBindings('{{ x + 1 }}', context, {}, false);
      expect(result['x + 1']).toBe(43);
    });

    it('should enforce the WASM sandbox memory limit', async () => {
      const prevReqMax = process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX;
      try {
        // Set an explicit heap cap (bytes) above the 16MiB floor.
        const capBytes = 20 * 1024 ** 2; // 20MiB
        process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX = String(capBytes);

        const context = new ExecutionContext();
        context.kvStore = new MockKVStore();
        context.useWasmBindingsSandbox = true;

        // Try to allocate a very large string in the VM; this should fail under the WASM sandbox memory limit.
        const expr = '{{ "x".repeat(30000000) }}';
        await expect(resolveAllBindings(expr, context, {}, false)).rejects.toThrow(/out of memory|memory/i);
      } finally {
        if (prevReqMax === undefined) delete process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX;
        else process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX = prevReqMax;
      }
    });

    it('should set useSandboxFileFetcher and use VariableClient when kvStore has fetchFileCallback (WASM)', async () => {
      const mockContent = 'sandbox-fetched-content';
      const kvStore = new MockKVStore();
      kvStore.fetchFileCallback = (path, callback) => {
        expect(path).toBe('/remote/file/path');
        callback(null, Buffer.from(mockContent));
      };

      const context = new ExecutionContext();
      context.kvStore = kvStore;
      context.useWasmBindingsSandbox = true;
      context.addGlobalVariable('FilePicker1', {
        files: [
          {
            name: 'test.txt',
            extension: 'txt',
            type: 'text/plain',
            size: 100,
            encoding: 'text',
            $superblocksId: 'test-id'
          }
        ]
      });

      const filePaths = { 'FilePicker1.files.0': '/remote/file/path' };
      const result = await resolveAllBindings('{{ FilePicker1.files[0].readContents("text") }}', context, filePaths, false);

      expect(result['FilePicker1.files[0].readContents("text")']).toBe(mockContent);
    });

    it('should use readContentsAsync with sandbox file fetcher (WASM)', async () => {
      const mockContent = 'async-sandbox-content';
      const kvStore = new MockKVStore();
      kvStore.fetchFileCallback = (path, callback) => {
        callback(null, Buffer.from(mockContent));
      };

      const context = new ExecutionContext();
      context.kvStore = kvStore;
      context.useWasmBindingsSandbox = true;
      context.addGlobalVariable('FilePicker1', {
        files: [
          {
            name: 'test.txt',
            extension: 'txt',
            type: 'text/plain',
            size: 100,
            encoding: 'text',
            $superblocksId: 'test-id'
          }
        ]
      });

      const filePaths = { 'FilePicker1.files.0': '/async/file/path' };
      const result = await resolveAllBindings('{{ await FilePicker1.files[0].readContentsAsync("text") }}', context, filePaths, false);

      expect(result['await FilePicker1.files[0].readContentsAsync("text")']).toBe(mockContent);
    });
  });

  describe('serialize', () => {
    it('should return buffer when mode is raw', () => {
      const buffer = Buffer.from('test');
      const result = serialize(buffer, 'raw');
      expect(result).toBe(buffer);
    });

    it('should return base64 string when mode is binary', () => {
      const buffer = Buffer.from('test');
      const result = serialize(buffer, 'binary');
      expect(result).toBe(buffer.toString('base64'));
    });

    it('should return utf8 string when mode is text', () => {
      const buffer = Buffer.from('test');
      const result = serialize(buffer, 'text');
      expect(result).toBe(buffer.toString('utf8'));
    });

    it('should detect utf8 string when mode is unknown', () => {
      const buffer = Buffer.from('test');
      const result = serialize(buffer);
      expect(result).toBe('test');
    });

    it('should detect binary data when mode is unknown', () => {
      const buffer = Buffer.from([0xff, 0xff, 0xff]);
      const result = serialize(buffer);
      // \u{FFFD} logic check: buffer with invalid utf8 should return base64
      // Buffer.from([0xFF]).toString('utf8') produces replacement char \uFFFD
      expect(result).toBe(buffer.toString('base64'));
    });
  });

  describe('VariableClient', () => {
    it('should throw when fetchFileCallback is called but kvStore does not implement it', () => {
      const kvStore = new MockKVStore();
      // Intentionally omit fetchFileCallback to simulate misconfiguration
      const client = new VariableClientImpl(kvStore);

      expect(() => {
        client.fetchFileCallback('/some/path', (_err, _result) => {});
      }).toThrow('KVStore does not implement fetchFileCallback');
    });
  });
});
