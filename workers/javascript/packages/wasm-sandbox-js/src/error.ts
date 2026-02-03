/**
 * QuickJS Error Handling
 *
 * This module processes error objects returned by QuickJS. It makes assumptions about
 * the structure of these error objects based on the current QuickJS version. If QuickJS
 * is upgraded and the error format changes, this code may need to be updated.
 *
 * ## QuickJS Error Object Structure
 *
 * When QuickJS evaluation fails, `ctx.dump(result.error)` returns an object with these properties:
 *
 * **Syntax errors:**
 * ```
 * {
 *   name: "SyntaxError",
 *   message: "unexpected token in expression: '@'",
 *   lineNumber: 1,       // 1-based line number where syntax error occurred
 *   stack: "    at <expression>:1:1\n"
 * }
 * ```
 *
 * **Runtime errors (e.g., ReferenceError):**
 * ```
 * {
 *   name: "ReferenceError",
 *   message: "'undefinedVar' is not defined",
 *   stack: "    at <expression>:1:1\n"
 * }
 * ```
 *
 * **Thrown errors with stack traces:**
 * ```
 * {
 *   name: "Error",
 *   message: "something went wrong",
 *   stack: "    at inner (<expression>:2:15)\n    at outer (<expression>:3:5)\n    at <eval> (<expression>:4:1)\n"
 * }
 * ```
 *
 * ## Key Format Assumptions
 *
 * 1. `lineNumber` property (number) - Present on syntax errors, used by adjustErrorLineNumbers
 * 2. `stack` property (string) - Contains stack trace with `<expression>:line:column` format
 * 3. `message` property (string) - Human-readable error description
 * 4. `name` property (string) - Error type name (e.g., "ReferenceError", "SyntaxError")
 *
 * ## Contract Tests
 *
 * The "QuickJS error contract" tests in error.test.ts verify these format assumptions
 * by testing directly against QuickJS. If those tests fail after a QuickJS upgrade,
 * review and update this module accordingly.
 *
 * @see error.test.ts - "QuickJS error contract" describe block
 */

/**
 * Number of prefix lines added by the internal async IIFE wrapper in sandbox.evaluate().
 * The wrapper `(async () => (\n${expr}\n))()` adds 1 line before user code.
 */
export const INTERNAL_WRAPPER_LINES = 1;

/**
 * Adjusts line numbers in a QuickJS error object to account for wrapper lines.
 * Also removes stack frames where the adjusted line number is <= 0 (wrapper frames),
 * or greater than maxUserLine (when provided).
 *
 * @param errorValue - The dumped QuickJS error object
 * @param totalWrapperLines - Total number of wrapper lines to subtract from line numbers
 * @param maxUserLine - Maximum user code line number to keep in stack traces
 * @returns The adjusted error object
 */
export function adjustErrorLineNumbers(errorValue: unknown, totalWrapperLines: number, maxUserLine?: number): unknown {
  if (typeof errorValue !== 'object' || errorValue === null) {
    return errorValue;
  }

  const error = errorValue as Record<string, unknown>;
  const adjusted: Record<string, unknown> = { ...error };

  // Adjust lineNumber property if present (used by syntax errors)
  if (typeof adjusted.lineNumber === 'number') {
    const adjustedLine = Math.max(1, adjusted.lineNumber - totalWrapperLines);
    adjusted.lineNumber = maxUserLine !== undefined ? Math.min(maxUserLine, adjustedLine) : adjustedLine;
  }

  // Adjust line numbers in stack trace and remove wrapper frames
  if (typeof adjusted.stack === 'string') {
    adjusted.stack = adjustStackTrace(adjusted.stack, totalWrapperLines, maxUserLine);
  }

  return adjusted;
}

/**
 * Adjusts line numbers in a stack trace string and removes frames where the
 * adjusted line number is <= 0 (wrapper frames) or greater than maxUserLine.
 *
 * **QuickJS Format Dependency:** This function uses the regex `/<expression>:(\d+):(\d+)/g`
 * to find and adjust line numbers. This assumes QuickJS stack traces use the format
 * `<expression>:line:column`. If QuickJS changes this format, this function will fail
 * to adjust line numbers correctly.
 *
 * Stack trace format examples:
 * - Syntax errors: "    at <expression>:2:5\n"
 * - Runtime errors: "    at <anonymous> (<expression>:2:1)\n    at <eval> (<expression>:1:15)\n"
 *
 * @see error.test.ts - "stack trace format" tests verify this format assumption
 */
export function adjustStackTrace(stack: string, totalWrapperLines: number, maxUserLine?: number): string {
  const lines = stack.split('\n');
  const adjustedLines: string[] = [];

  for (const line of lines) {
    // Match patterns like "<expression>:line:column" and adjust the line number
    let shouldKeep = true;
    const adjustedLine = line.replace(/<expression>:(\d+):(\d+)/g, (_match, lineStr, col) => {
      const originalLine = parseInt(lineStr, 10);
      const adjustedLineNum = originalLine - totalWrapperLines;

      // If adjusted line is <= 0, this frame is from wrapper code, mark for removal
      if (adjustedLineNum <= 0) {
        shouldKeep = false;
        return `<expression>:${adjustedLineNum}:${col}`;
      }

      if (maxUserLine !== undefined && adjustedLineNum > maxUserLine) {
        shouldKeep = false;
        return `<expression>:${adjustedLineNum}:${col}`;
      }

      return `<expression>:${adjustedLineNum}:${col}`;
    });

    // Keep the frame if it's not a wrapper frame, or if it didn't contain a line number
    if (shouldKeep) {
      adjustedLines.push(adjustedLine);
    }
  }

  return adjustedLines.join('\n');
}

/**
 * Extracts a human-readable error message from a QuickJS error value.
 * Prefers the `message` property if available, falls back to JSON.stringify or String.
 */
export function errorValueToMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  // If it's an object with a message property, use that
  if (typeof value === 'object' && value !== null) {
    const msg = (value as Record<string, unknown>).message;
    if (typeof msg === 'string') {
      return msg;
    }
  }

  try {
    if (typeof value === 'string') {
      return value;
    }

    // JSON.stringify returns undefined for undefined values, so fall back to String()
    const json = JSON.stringify(value);
    return json !== undefined ? json : String(value);
  } catch {
    return String(value);
  }
}

/**
 * Creates an Error from a QuickJS error value, preserving the QuickJS stack trace.
 * The resulting Error will have:
 * - message: extracted from the QuickJS error
 * - stack: the QuickJS stack trace (from the sandbox), not the host JS stack
 */
export function createErrorFromQuickJS(errorValue: unknown): Error {
  const message = errorValueToMessage(errorValue);
  const error = new Error(message);

  // Extract the QuickJS stack trace if available
  if (typeof errorValue === 'object' && errorValue !== null) {
    const quickjsError = errorValue as Record<string, unknown>;
    const quickjsStack = quickjsError.stack;
    const errorName = typeof quickjsError.name === 'string' ? quickjsError.name : 'Error';

    if (typeof quickjsStack === 'string' && quickjsStack.trim()) {
      // Use only the QuickJS stack, not the host stack
      error.stack = `${errorName}: ${message}\n${quickjsStack}`;
    }
  }

  return error;
}
