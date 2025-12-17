import { describe, expect, it } from '@jest/globals';
import { ExecutionContext } from '../../types';
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

    it('should not allow requiring restricted modules', async () => {
      const context = new ExecutionContext();
      // TODO: `fs` is still not blocked by the VM2 codepath because it is used internally. When this is fixed (or the VM2 codepath is removed),
      // we should re-enable the following tests.
      // await expect(resolveAllBindings('{{ require("fs") }}', context, {}, false)).rejects.toThrow();
      // await expect(resolveAllBindings('{{ require("node:fs") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("child_process") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("node:child_process") }}', context, {}, false)).rejects.toThrow();
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
