import { describe, expect, it } from '@jest/globals';
import { ExecutionContext } from '../../types';
import { createFunctionForPreparingGlobalObjectForFiles, resolveAllBindings, serialize } from './utils';

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
      await expect(resolveAllBindings('{{ require("fs") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("node:fs") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("child_process") }}', context, {}, false)).rejects.toThrow();
      await expect(resolveAllBindings('{{ require("node:child_process") }}', context, {}, false)).rejects.toThrow();
    });
  });

  describe('createFunctionForPreparingGlobalObjectForFiles', () => {
    it('should attach readContents and readContentsAsync to file objects', () => {
      const fileServerUrl = 'http://localhost:8080';
      const agentKey = 'test-agent-key';
      const filePaths = {
        'FilePicker1.file': '/path/to/file1',
        'FilePicker2.file': '/path/to/file2'
      };

      const prepareGlobalObject = createFunctionForPreparingGlobalObjectForFiles(
        fileServerUrl,
        agentKey,
        filePaths
      );

      const globalObject = {
        FilePicker1: {
          file: {
            $superblocksId: 'file1',
            name: 'file1.txt',
            size: 100,
            type: 'text/plain'
          }
        },
        FilePicker2: {
          file: {
            $superblocksId: 'file2',
            name: 'file2.png',
            size: 200,
            type: 'image/png'
          }
        }
      };

      prepareGlobalObject(globalObject);

      expect(typeof (globalObject.FilePicker1.file as any).readContents).toBe('function');
      expect(typeof (globalObject.FilePicker1.file as any).readContentsAsync).toBe('function');
      expect(typeof (globalObject.FilePicker2.file as any).readContents).toBe('function');
      expect(typeof (globalObject.FilePicker2.file as any).readContentsAsync).toBe('function');
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
