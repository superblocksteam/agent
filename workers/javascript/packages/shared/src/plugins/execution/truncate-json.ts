// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const truncateJsonLib = require('@mmkal/truncate-json') as (
  jsonString: string,
  maxSize: number
) => { jsonString: string; truncatedProps: unknown[] };

export function truncateJson(value: unknown, maxBytes: number): { json: string; truncated: boolean; originalBytes: number } {
  if (value == null) return { json: '', truncated: false, originalBytes: 0 };
  try {
    const json = JSON.stringify(value);
    const originalBytes = Buffer.byteLength(json, 'utf8');
    if (originalBytes <= maxBytes) return { json, truncated: false, originalBytes };
    const { jsonString } = truncateJsonLib(json, maxBytes);
    const resultBytes = Buffer.byteLength(jsonString, 'utf8');
    // The library can drop every property/element when even one entry exceeds
    // the limit (e.g. `{ body: <very long string> }` becomes `{}`). That renders
    // as "Empty object." in the trace, hiding the integration's actual payload,
    // so fall through to the sentinel which preserves the original size.
    const collapsedToEmpty = jsonString === '{}' || jsonString === '[]';
    if (resultBytes <= maxBytes && !collapsedToEmpty) {
      return { json: jsonString, truncated: true, originalBytes };
    }
    const fallback = JSON.stringify({ $truncated: true, $originalBytes: originalBytes });
    return { json: fallback, truncated: true, originalBytes };
  } catch {
    return { json: '{}', truncated: true, originalBytes: 0 };
  }
}
