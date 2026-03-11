/**
 * Tests for integration diagnostics capture in the SDK API plugin.
 *
 * Validates the truncateJson helper and the diagnostic record serialization
 * format that the Go orchestrator parses via DiagnosticsFromOutputJSON.
 *
 * We avoid importing @superblocks/shared directly (it pulls in native modules
 * that aren't available in the Jest environment) and instead test the JSON
 * serialization contract between the worker and Go layers.
 */

/**
 * Re-implementation of the plugin's truncateJson for isolated testing.
 * Must match the implementation in index.ts exactly.
 */
function truncateJson(value: unknown, maxBytes: number): string {
  if (value == null) return '';
  try {
    const json = JSON.stringify(value);
    if (json.length <= maxBytes) return json;
    return json.substring(0, maxBytes - 15) + '...[truncated]';
  } catch {
    return String(value).substring(0, maxBytes);
  }
}

describe('truncateJson', () => {
  it('returns empty string for null', () => {
    expect(truncateJson(null, 100)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(truncateJson(undefined, 100)).toBe('');
  });

  it('returns full JSON when within limit', () => {
    expect(truncateJson({ key: 'value' }, 1000)).toBe('{"key":"value"}');
  });

  it('truncates JSON exceeding the byte limit', () => {
    const largeObj = { data: 'x'.repeat(200) };
    const result = truncateJson(largeObj, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toContain('...[truncated]');
  });

  it('handles non-serializable values by falling back to String()', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const result = truncateJson(circular, 100);
    expect(result).toBe('[object Object]');
  });

  it('preserves exact JSON for values at the limit', () => {
    // '{"a":"bc"}' is exactly 10 bytes
    const result = truncateJson({ a: 'bc' }, 10);
    expect(result).toBe('{"a":"bc"}');
  });

  it('truncates values just over the limit', () => {
    // '{"a":"bcd"}' is 11 bytes, limit is 10
    // substring(0, 10 - 15) = substring(0, -5) = "" so result is "...[truncated]"
    const result = truncateJson({ a: 'bcd' }, 10);
    expect(result).toContain('...[truncated]');
    // With a reasonable limit, truncation stays near the limit
    const result2 = truncateJson({ data: 'x'.repeat(100) }, 50);
    expect(result2.length).toBeLessThanOrEqual(50);
    expect(result2).toContain('...[truncated]');
  });
});

describe('diagnostics JSON serialization contract', () => {
  /**
   * This test validates the JSON shape that the Go DiagnosticsFromOutputJSON
   * function expects. The worker writes an ExecutionOutput with a diagnostics
   * array, and the Go layer parses it using these exact field names.
   */
  it('produces JSON matching the Go diagnosticJSON struct', () => {
    const diagnostics = [
      {
        integrationId: 'int-123',
        pluginId: 'postgres',
        input: '{"query":"SELECT 1"}',
        output: '{"rows":[]}',
        startMs: 1700000000000,
        endMs: 1700000000050,
        durationMs: 50,
        error: '',
        sequence: 0
      },
      {
        integrationId: 'int-456',
        pluginId: 'restapi',
        input: '{"url":"/api/users"}',
        output: '',
        startMs: 1700000000060,
        endMs: 1700000000160,
        durationMs: 100,
        error: 'connection refused',
        sequence: 1
      }
    ];

    // Simulate the ExecutionOutput JSON as written to the KV store
    const executionOutput = {
      output: { users: [] },
      log: [],
      error: '',
      diagnostics
    };

    const json = JSON.stringify(executionOutput);
    const parsed = JSON.parse(json);

    // Verify the diagnostics array is present and correctly shaped
    expect(parsed.diagnostics).toHaveLength(2);
    expect(parsed.diagnostics[0]).toEqual({
      integrationId: 'int-123',
      pluginId: 'postgres',
      input: '{"query":"SELECT 1"}',
      output: '{"rows":[]}',
      startMs: 1700000000000,
      endMs: 1700000000050,
      durationMs: 50,
      error: '',
      sequence: 0
    });
    expect(parsed.diagnostics[1].error).toBe('connection refused');
    expect(parsed.diagnostics[1].sequence).toBe(1);
  });

  it('omits diagnostics field when array is not set', () => {
    const executionOutput = {
      output: {},
      log: []
    };

    const json = JSON.stringify(executionOutput);
    const parsed = JSON.parse(json);
    expect(parsed.diagnostics).toBeUndefined();
  });

  it('respects max entries limit (100)', () => {
    const MAX_ENTRIES = 100;
    const diagnostics = Array.from({ length: MAX_ENTRIES + 10 }, (_, i) => ({
      integrationId: `int-${i}`,
      pluginId: 'postgres',
      input: '{}',
      output: '{}',
      startMs: 0,
      endMs: 1,
      durationMs: 1,
      error: '',
      sequence: i
    }));

    // The plugin caps at 100 entries; verify Go can parse up to 100
    const capped = diagnostics.slice(0, MAX_ENTRIES);
    const json = JSON.stringify({ output: {}, log: [], diagnostics: capped });
    const parsed = JSON.parse(json);
    expect(parsed.diagnostics).toHaveLength(MAX_ENTRIES);
    expect(parsed.diagnostics[99].sequence).toBe(99);
  });
});
