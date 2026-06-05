const extractPathRegex = /\s+at.*[(\s](.*)\)?/;
// V8 SyntaxError stacks start with a "<filename>:<line>" location header. With vm2 3.11+
// the VM filename is a plain name (no leading "/"), so the startsWith('/') filter below
// no longer catches it — match the exact filenames passed to vm.run (kept in sync with
// the bootstraps) so user error messages that happen to look like "word:123" survive.
const locationHeaderRegex = /^(?:user-code|code-mode-bundle):\d+(?::\d+)?$/;
// Sandbox frames carry the VM filename, which is a plain name without path separators
// (e.g. "user-code", "code-mode-bundle"). vm2 3.11+ host errors (VMError etc.) put vm2's
// own internal frames first, so prefer a sandbox frame for line extraction before
// falling back to the first frame.
const sandboxFrameRegex = /\s+at\s+(?:.*\()?([^\s/():]+):(\d+):\d+\)?/;

/**
 * Cleans a V8 error stack trace for display to users.
 *
 * Strips internal stack frames (lines matching "  at ..." or starting with "/"),
 * extracts the error line number, and formats the result as:
 *   "Error on line N:\n<message>"
 *
 * When source maps have been applied, extracts the original source position from
 * the first .ts/.tsx frame instead of computing it from the raw frame offset.
 *
 * Returns undefined when no useful content could be extracted so the caller
 * can fall back to the raw error message.
 *
 * @param {string | undefined} stack
 * @param {number} lineOffset
 * @param {boolean} [sourceMapApplied]
 * @returns {string | undefined}
 */
function cleanStack(stack, lineOffset, sourceMapApplied) {
  if (!stack) {
    return undefined;
  }

  if (sourceMapApplied) {
    const sourceMatch = stack.match(/([\w/.-]+\.tsx?):(\d+):\d+/);
    if (sourceMatch) {
      const sourcePath = sourceMatch[1];
      const sourceLine = parseInt(sourceMatch[2], 10);
      const errorStack = filterFrames(stack);
      if (!errorStack) return undefined;
      return `Error on line ${sourceLine} (${sourcePath}):\n${errorStack}`;
    }
  }

  const errorLines = stack.replace(/\\/g, '/').split('\n');

  let errorLineNumber = parseInt(errorLines[0].split(':').pop() ?? '');

  if (isNaN(errorLineNumber)) {
    for (const line of errorLines) {
      const sandboxMatch = line.match(sandboxFrameRegex);
      if (sandboxMatch) {
        errorLineNumber = parseInt(sandboxMatch[2], 10);
        break;
      }
    }
  }

  const errorStack = errorLines
    .filter((line) => {
      const pathMatches = line.match(extractPathRegex);
      if (isNaN(errorLineNumber) && pathMatches) {
        const lineSplit = line.split(':');
        errorLineNumber = parseInt(lineSplit[lineSplit.length - 2]);
      }
      return !pathMatches && !line.startsWith('/') && !locationHeaderRegex.test(line);
    })
    .filter((line) => line.trim() !== '')
    .join('\n');

  if (isNaN(errorLineNumber)) return errorStack || undefined;
  if (!errorStack) return undefined;
  return `Error on line ${errorLineNumber - lineOffset}:\n${errorStack}`;
}

function filterFrames(stack) {
  return stack
    .replace(/\\/g, '/')
    .split('\n')
    .filter((line) => {
      const pathMatches = line.match(extractPathRegex);
      return !pathMatches && !line.startsWith('/') && !locationHeaderRegex.test(line);
    })
    .filter((line) => line.trim() !== '')
    .join('\n');
}

module.exports = { cleanStack };
