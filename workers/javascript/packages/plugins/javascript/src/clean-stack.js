const extractPathRegex = /\s+at.*[(\s](.*)\)?/;

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

  const errorStack = errorLines
    .filter((line) => {
      const pathMatches = line.match(extractPathRegex);
      if (isNaN(errorLineNumber) && pathMatches) {
        const lineSplit = line.split(':');
        errorLineNumber = parseInt(lineSplit[lineSplit.length - 2]);
      }
      return !pathMatches && !line.startsWith('/');
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
      return !pathMatches && !line.startsWith('/');
    })
    .filter((line) => line.trim() !== '')
    .join('\n');
}

module.exports = { cleanStack };
