import { describe, expect, it } from '@jest/globals';

const { cleanStack } = require('./clean-stack');

describe('cleanStack', () => {
  const lineOffset = 3;

  it('returns undefined for undefined/null stack', () => {
    expect(cleanStack(undefined, lineOffset)).toBeUndefined();
    expect(cleanStack(null as any, lineOffset)).toBeUndefined();
  });

  it('extracts error message and line number from a standard V8 stack', () => {
    const stack = [
      'Error: something broke',
      '    at Object.<anonymous> (/path/to/file.js:10:5)',
      '    at Module._compile (/path/to/loader.js:999:30)',
    ].join('\n');

    const result = cleanStack(stack, lineOffset);
    expect(result).toBe('Error on line 7:\nError: something broke');
  });

  it('extracts line number from first "at" frame when message line has no colon-delimited number', () => {
    const stack = [
      'ReferenceError: x is not defined',
      '    at Object.<anonymous> (/path/to/file.js:20:1)',
    ].join('\n');

    const result = cleanStack(stack, lineOffset);
    expect(result).toBe('Error on line 17:\nReferenceError: x is not defined');
  });

  it('preserves error message when stack has only frame lines (no message prefix)', () => {
    const stack = [
      '    at Object.<anonymous> (/path/to/file.js:40:5)',
      '    at Module._compile (/path/to/loader.js:999:30)',
    ].join('\n');

    const result = cleanStack(stack, lineOffset);
    // When errorStack is empty after filtering, cleanStack should return
    // undefined so the caller can fall back to err.message
    expect(result).toBeUndefined();
  });

  it('returns the error message as-is when no line number is found', () => {
    const stack = 'SomeCustomError: query timed out';
    const result = cleanStack(stack, lineOffset);
    expect(result).toBe('SomeCustomError: query timed out');
  });

  it('preserves error message that contains the word "relation"', () => {
    const stack = 'Error: relation shipping_status does not exist\n    at Object.<anonymous> (/file.js:10:5)';
    const result = cleanStack(stack, lineOffset);
    expect(result).toBe('Error on line 7:\nError: relation shipping_status does not exist');
  });

  it('returns undefined when stack is empty string', () => {
    expect(cleanStack('', lineOffset)).toBeUndefined();
  });

  describe('with source maps', () => {
    it('uses source-mapped line and path from .ts frame', () => {
      const stack = [
        'Error: integration failed',
        '    at executeApi (apis/get-users.ts:3:10)',
        '    at Object.<anonymous> (/internal/runner.js:100:20)',
      ].join('\n');

      const result = cleanStack(stack, lineOffset, true);
      expect(result).toBe('Error on line 3 (apis/get-users.ts):\nError: integration failed');
    });

    it('returns undefined when source-mapped stack has only frame lines', () => {
      const stack = [
        '    at executeApi (apis/get-users.ts:37:10)',
        '    at Object.<anonymous> (/internal/runner.js:100:20)',
      ].join('\n');

      const result = cleanStack(stack, lineOffset, true);
      expect(result).toBeUndefined();
    });

    it('falls through to non-source-map path when no .ts frame is found', () => {
      const stack = [
        'Error: plain JS error',
        '    at Object.<anonymous> (/path/to/file.js:10:5)',
      ].join('\n');

      const result = cleanStack(stack, lineOffset, true);
      expect(result).toBe('Error on line 7:\nError: plain JS error');
    });
  });
});
