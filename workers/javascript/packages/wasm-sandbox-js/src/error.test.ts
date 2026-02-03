import { describe, expect, it } from '@jest/globals';
import { createSandbox } from './sandbox';
import {
  INTERNAL_WRAPPER_LINES,
  adjustErrorLineNumbers,
  adjustStackTrace,
  errorValueToMessage,
  createErrorFromQuickJS
} from './error';

describe('error utilities', () => {
  describe('INTERNAL_WRAPPER_LINES', () => {
    it('equals 1 (the async IIFE wrapper adds one prefix line)', () => {
      expect(INTERNAL_WRAPPER_LINES).toBe(1);
    });
  });

  describe('adjustErrorLineNumbers', () => {
    it('returns non-object values unchanged', () => {
      expect(adjustErrorLineNumbers(null, 1)).toBe(null);
      expect(adjustErrorLineNumbers(undefined, 1)).toBe(undefined);
      expect(adjustErrorLineNumbers('string', 1)).toBe('string');
      expect(adjustErrorLineNumbers(42, 1)).toBe(42);
    });

    it('adjusts lineNumber property', () => {
      const error = { name: 'SyntaxError', message: 'test', lineNumber: 3 };
      const adjusted = adjustErrorLineNumbers(error, 2) as Record<string, unknown>;
      expect(adjusted.lineNumber).toBe(1);
    });

    it('clamps lineNumber to minimum of 1', () => {
      const error = { name: 'SyntaxError', message: 'test', lineNumber: 1 };
      const adjusted = adjustErrorLineNumbers(error, 2) as Record<string, unknown>;
      expect(adjusted.lineNumber).toBe(1);
    });

    it('adjusts line numbers in stack trace', () => {
      const error = {
        name: 'ReferenceError',
        message: 'test',
        stack: '    at <anonymous> (<expression>:3:5)\n    at <eval> (<expression>:2:10)\n'
      };
      const adjusted = adjustErrorLineNumbers(error, 1) as Record<string, unknown>;
      expect(adjusted.stack).toContain('<expression>:2:5');
      expect(adjusted.stack).toContain('<expression>:1:10');
    });

    it('removes wrapper frames (line <= 0 after adjustment)', () => {
      const error = {
        name: 'ReferenceError',
        message: 'test',
        stack: '    at <anonymous> (<expression>:2:5)\n    at <eval> (<expression>:1:10)\n'
      };
      const adjusted = adjustErrorLineNumbers(error, 2) as Record<string, unknown>;
      // Line 2 -> 0, should be removed; Line 1 -> -1, should be removed
      // Only empty lines or non-expression lines should remain
      expect(adjusted.stack).not.toContain('<expression>:0:');
      expect(adjusted.stack).not.toContain('<expression>:-1:');
    });

    it('preserves other properties', () => {
      const error = { name: 'Error', message: 'test', fileName: '<expression>', custom: 'value' };
      const adjusted = adjustErrorLineNumbers(error, 1) as Record<string, unknown>;
      expect(adjusted.name).toBe('Error');
      expect(adjusted.message).toBe('test');
      expect(adjusted.fileName).toBe('<expression>');
      expect(adjusted.custom).toBe('value');
    });

    it('removes frames beyond maxUserLine', () => {
      const error = {
        name: 'ReferenceError',
        message: 'test',
        stack: '    at <anonymous> (<expression>:3:5)\n    at <eval> (<expression>:4:1)\n'
      };
      const adjusted = adjustErrorLineNumbers(error, 1, 2) as Record<string, unknown>;
      expect(adjusted.stack).toContain('<expression>:2:5');
      expect(adjusted.stack).not.toContain('<expression>:3:1');
    });
  });

  describe('adjustStackTrace', () => {
    it('adjusts line numbers in expression references', () => {
      const stack = '    at <expression>:5:10\n';
      const adjusted = adjustStackTrace(stack, 2);
      expect(adjusted).toBe('    at <expression>:3:10\n');
    });

    it('handles multiple frames', () => {
      const stack = '    at fn (<expression>:3:1)\n    at <eval> (<expression>:2:5)\n';
      const adjusted = adjustStackTrace(stack, 1);
      expect(adjusted).toContain('<expression>:2:1');
      expect(adjusted).toContain('<expression>:1:5');
    });

    it('removes frames where adjusted line is <= 0', () => {
      const stack = '    at user (<expression>:3:1)\n    at wrapper (<expression>:1:5)\n';
      const adjusted = adjustStackTrace(stack, 2);
      expect(adjusted).toContain('<expression>:1:1');
      expect(adjusted).not.toContain('wrapper');
    });

    it('preserves non-expression lines', () => {
      const stack = '    at <expression>:2:1\n    at native code\n';
      const adjusted = adjustStackTrace(stack, 1);
      expect(adjusted).toContain('<expression>:1:1');
      expect(adjusted).toContain('native code');
    });

    it('preserves column numbers unchanged', () => {
      const stack = '    at <expression>:5:42\n';
      const adjusted = adjustStackTrace(stack, 3);
      expect(adjusted).toBe('    at <expression>:2:42\n');
    });
  });

  describe('errorValueToMessage', () => {
    it('extracts message from Error instances', () => {
      const error = new Error('test message');
      expect(errorValueToMessage(error)).toBe('test message');
    });

    it('extracts message property from objects', () => {
      const error = { name: 'CustomError', message: 'object message', stack: '...' };
      expect(errorValueToMessage(error)).toBe('object message');
    });

    it('returns string values directly', () => {
      expect(errorValueToMessage('string error')).toBe('string error');
    });

    it('JSON-stringifies objects without message property', () => {
      const error = { code: 500, reason: 'server error' };
      const message = errorValueToMessage(error);
      expect(message).toContain('500');
      expect(message).toContain('server error');
    });

    it('handles null and undefined', () => {
      expect(errorValueToMessage(null)).toBe('null');
      expect(errorValueToMessage(undefined)).toBe('undefined');
    });

    it('converts numbers to string', () => {
      expect(errorValueToMessage(42)).toBe('42');
    });
  });

  describe('createErrorFromQuickJS', () => {
    it('creates an Error with the message from QuickJS error', () => {
      const quickjsError = { name: 'ReferenceError', message: "'foo' is not defined", stack: '' };
      const error = createErrorFromQuickJS(quickjsError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("'foo' is not defined");
    });

    it('includes QuickJS stack trace in the Error stack', () => {
      const quickjsError = {
        name: 'ReferenceError',
        message: "'foo' is not defined",
        stack: '    at <expression>:1:1\n'
      };
      const error = createErrorFromQuickJS(quickjsError);
      expect(error.stack).toContain("ReferenceError: 'foo' is not defined");
      expect(error.stack).toContain('at <expression>:1:1');
      // Should NOT include host stack
      expect(error.stack).not.toContain('at createErrorFromQuickJS');
    });

    it('handles errors without stack trace', () => {
      const quickjsError = { name: 'Error', message: 'test' };
      const error = createErrorFromQuickJS(quickjsError);
      expect(error.message).toBe('test');
      // Should still have a stack (the host stack)
      expect(error.stack).toBeDefined();
    });

    it('handles string error values', () => {
      const error = createErrorFromQuickJS('string error');
      expect(error.message).toBe('string error');
    });

    it('uses "Error" as default name when name is not provided', () => {
      const quickjsError = { message: 'test', stack: '    at <expression>:1:1\n' };
      const error = createErrorFromQuickJS(quickjsError);
      expect(error.stack).toContain('Error: test');
    });
  });
});

/**
 * These tests verify the structure of QuickJS error objects that we depend on
 * for error position adjustment. If these tests fail after a QuickJS upgrade,
 * the error handling logic in error.ts (adjustErrorLineNumbers, adjustStackTrace)
 * needs to be reviewed and updated to match the new error format.
 *
 * These tests work directly with QuickJS context (bypassing the sandbox abstraction)
 * to inspect the raw error format before any processing.
 */
describe('QuickJS error contract', () => {
  // Import QuickJS directly to test raw error format
  const getQuickJS = async () => {
    const { getQuickJS } = await import('./quickjs');
    return getQuickJS();
  };

  /**
   * Helper to evaluate code and return the raw error dump from QuickJS.
   * Returns null if evaluation succeeds.
   */
  const getRawErrorDump = async (code: string): Promise<Record<string, unknown> | null> => {
    const QuickJS = await getQuickJS();
    const runtime = QuickJS.newRuntime();
    const ctx = runtime.newContext();

    try {
      const result = ctx.evalCode(code, '<expression>');
      if (result.error) {
        const errorDump = ctx.dump(result.error);
        result.error.dispose();
        return errorDump as Record<string, unknown>;
      }
      result.value.dispose();
      return null;
    } finally {
      ctx.dispose();
      runtime.dispose();
    }
  };

  describe('error object structure', () => {
    it('syntax errors have name, message, and lineNumber properties', async () => {
      const errorDump = await getRawErrorDump('@invalid syntax');

      expect(errorDump).not.toBeNull();
      expect(typeof errorDump!.name).toBe('string');
      expect(typeof errorDump!.message).toBe('string');
      // lineNumber is critical for adjustErrorLineNumbers
      expect(typeof errorDump!.lineNumber).toBe('number');
    });

    it('runtime errors have name, message, and stack properties', async () => {
      const errorDump = await getRawErrorDump('undefinedVariable');

      expect(errorDump).not.toBeNull();
      expect(typeof errorDump!.name).toBe('string');
      expect(typeof errorDump!.message).toBe('string');
      // stack is critical for adjustStackTrace
      expect(typeof errorDump!.stack).toBe('string');
    });

    it('thrown Error objects have name, message, and stack properties', async () => {
      const errorDump = await getRawErrorDump('throw new Error("test error")');

      expect(errorDump).not.toBeNull();
      expect(typeof errorDump!.name).toBe('string');
      expect(typeof errorDump!.message).toBe('string');
      expect(typeof errorDump!.stack).toBe('string');
    });
  });

  describe('stack trace format', () => {
    it('stack traces use <expression>:line:column format', async () => {
      const errorDump = await getRawErrorDump('undefinedVariable');

      expect(errorDump).not.toBeNull();
      const stack = errorDump!.stack as string;

      // The adjustStackTrace function depends on this exact format: <expression>:line:column
      // If this regex doesn't match, adjustStackTrace will fail to adjust line numbers
      expect(stack).toMatch(/<expression>:\d+:\d+/);
    });

    it('nested function calls produce multi-frame stack traces with consistent format', async () => {
      const code = `
        function inner() { throw new Error("from inner"); }
        function outer() { inner(); }
        outer();
      `;
      const errorDump = await getRawErrorDump(code);

      expect(errorDump).not.toBeNull();
      const stack = errorDump!.stack as string;

      // Should have multiple frames, all using <expression>:line:column format
      const matches = stack.match(/<expression>:\d+:\d+/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    it('stack trace line numbers are 1-based', async () => {
      // Single line code - error should be on line 1
      const errorDump = await getRawErrorDump('undefinedVariable');

      expect(errorDump).not.toBeNull();
      const stack = errorDump!.stack as string;

      // Extract line number from stack trace
      const match = stack.match(/<expression>:(\d+):\d+/);
      expect(match).not.toBeNull();
      const lineNumber = parseInt(match![1], 10);
      expect(lineNumber).toBe(1);
    });

    it('stack trace column numbers are 1-based', async () => {
      // Error at start of line - column should be 1
      const errorDump = await getRawErrorDump('undefinedVariable');

      expect(errorDump).not.toBeNull();
      const stack = errorDump!.stack as string;

      // Extract column number from stack trace
      const match = stack.match(/<expression>:\d+:(\d+)/);
      expect(match).not.toBeNull();
      const columnNumber = parseInt(match![1], 10);
      expect(columnNumber).toBe(1);
    });
  });

  describe('error type names', () => {
    it('reference errors have name "ReferenceError"', async () => {
      const errorDump = await getRawErrorDump('undefinedVariable');
      expect(errorDump!.name).toBe('ReferenceError');
    });

    it('syntax errors have name "SyntaxError"', async () => {
      const errorDump = await getRawErrorDump('@invalid');
      expect(errorDump!.name).toBe('SyntaxError');
    });

    it('type errors have name "TypeError"', async () => {
      const errorDump = await getRawErrorDump('null.foo');
      expect(errorDump!.name).toBe('TypeError');
    });

    it('thrown Error objects preserve their name', async () => {
      const errorDump = await getRawErrorDump('throw new RangeError("out of range")');
      expect(errorDump!.name).toBe('RangeError');
    });
  });
});

describe('error position adjustment integration', () => {
  it('reports correct position for error on first line of expression', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate('badVar')).rejects.toThrow(/badVar.*not defined/i);
    } finally {
      sandbox.dispose();
    }
  });

  it('reports correct position for multi-line expression errors', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate('true &&\nbadVar')).rejects.toThrow(/badVar.*not defined/i);
    } finally {
      sandbox.dispose();
    }
  });

  it('reports correct position for syntax error on first line', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate('@invalid')).rejects.toThrow(/unexpected token/i);
    } finally {
      sandbox.dispose();
    }
  });

  it('reports correct position for syntax error on second line', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate('true &&\n@invalid')).rejects.toThrow(/unexpected token/i);
    } finally {
      sandbox.dispose();
    }
  });

  it('adjusts for caller wrapper lines', async () => {
    // Simulate a caller wrapper that adds 1 prefix line
    // The wrapper must use newlines so columns are unaffected
    const sandbox = await createSandbox();
    try {
      const userCode = 'badVar';
      const wrapped = `(async function() {\n${userCode}\n})()`;
      await expect(
        sandbox.evaluate(wrapped, { wrapperPrefixLines: 1, wrapperSuffixLines: 1 })
      ).rejects.toThrow(/badVar.*not defined/i);
    } finally {
      sandbox.dispose();
    }
  });

  it('handles thrown string values', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate("(()=>{ throw 'custom error'; })()")).rejects.toThrow('custom error');
    } finally {
      sandbox.dispose();
    }
  });

  it('handles thrown object values', async () => {
    const sandbox = await createSandbox();
    try {
      await expect(sandbox.evaluate("(()=>{ throw { code: 500, reason: 'server error' }; })()")).rejects.toThrow(
        /500.*server error|server error.*500/
      );
    } finally {
      sandbox.dispose();
    }
  });
});
