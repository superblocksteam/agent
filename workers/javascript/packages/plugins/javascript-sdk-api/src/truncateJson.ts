/**
 * Truncates a value's JSON representation to a byte limit while preserving
 * valid JSON. Used by the SDK API plugin for diagnostic input/output.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const truncateJsonLib = require('@mmkal/truncate-json') as (
  jsonString: string,
  maxSize: number
) => { jsonString: string; truncatedProps: unknown[] };

export function truncateJson(
  value: unknown,
  maxBytes: number
): { json: string; truncated: boolean; originalBytes: number } {
  if (value == null) return { json: '', truncated: false, originalBytes: 0 };
  try {
    const json = JSON.stringify(value);
    const originalBytes = Buffer.byteLength(json, 'utf8');
    if (originalBytes <= maxBytes) return { json, truncated: false, originalBytes };
    const { jsonString } = truncateJsonLib(json, maxBytes);
    const resultBytes = Buffer.byteLength(jsonString, 'utf8');
    if (resultBytes <= maxBytes) {
      return { json: jsonString, truncated: true, originalBytes };
    }
    // Library cannot shrink primitives (e.g. a 20KB string); it returns unchanged.
    // Enforce the limit with a small sentinel so we never exceed maxBytes.
    const fallback = JSON.stringify({ $truncated: true, $originalBytes: originalBytes });
    return { json: fallback, truncated: true, originalBytes };
  } catch {
    return { json: '{}', truncated: true, originalBytes: 0 };
  }
}
