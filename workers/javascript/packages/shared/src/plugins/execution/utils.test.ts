import { describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '../../types';
import * as wasmSandbox from '@superblocks/wasm-sandbox-js';
import * as vm from './vm';
import { resolveAllBindings, serialize } from './utils';

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
      expect(result).toEqual({ 'foo': 'bar' });
    });

    it('should resolve multiple bindings', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('a', 1);
      context.addGlobalVariable('b', 2);

      const result = await resolveAllBindings('{{ a }} + {{ b }}', context, {}, false);

      expect(result).toEqual({
        'a': 1,
        'b': 2,
      });
    });

    it('should resolve complex expressions', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('x', 10);

      const result = await resolveAllBindings('{{ x * 2 }}', context, {}, false);

      expect(result).toEqual({
        'x * 2': 20,
      });
    });

    it('should handle array access', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('arr', [1, 2, 3]);

      const result = await resolveAllBindings('{{ arr[0] }}', context, {}, false);

      expect(result).toEqual({
        'arr[0]': 1,
      });
    });

    it('should handle object access', async () => {
      const context = new ExecutionContext();
      context.addGlobalVariable('obj', { key: 'value' });

      const result = await resolveAllBindings('{{ obj.key }}', context, {}, false);

      expect(result).toEqual({
        'obj.key': 'value',
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

    it('should enforce the WASM sandbox memory limit', async () => {
      const prevReqMax = process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX;
      try {
        // Set an explicit heap cap (bytes) above the 16MiB floor.
        const capBytes = 20 * 1024 ** 2; // 20MiB
        process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX = String(capBytes);

        const context = new ExecutionContext();
        context.useWasmBindingsSandbox = true;

        // Try to allocate a very large string in the VM; this should fail under the WASM sandbox memory limit.
        const expr = '{{ "x".repeat(30000000) }}';
        await expect(resolveAllBindings(expr, context, {}, false)).rejects.toThrow(/out of memory|memory/i);
      } finally {
        if (prevReqMax === undefined) delete process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX;
        else process.env.SUPERBLOCKS_ORCHESTRATOR_GRPC_MSG_REQ_MAX = prevReqMax;
      }
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
      const buffer = Buffer.from([0xFF, 0xFF, 0xFF]);
      const result = serialize(buffer);
      // \u{FFFD} logic check: buffer with invalid utf8 should return base64
      // Buffer.from([0xFF]).toString('utf8') produces replacement char \uFFFD
      expect(result).toBe(buffer.toString('base64'));
    });
  });
});
