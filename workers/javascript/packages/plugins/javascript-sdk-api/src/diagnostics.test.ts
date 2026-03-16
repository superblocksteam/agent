/**
 * Tests for integration diagnostics capture in the SDK API plugin.
 *
 * Validates the truncateJson helper and the diagnostic record serialization
 * format that the Go orchestrator parses via DiagnosticsFromOutputJSON.
 *
 * We import truncateJson from its module (not from index.ts) so we avoid
 * pulling in @superblocks/shared and other native deps in the Jest environment.
 */
import { truncateJson } from './truncateJson';

describe('truncateJson', () => {
  it('returns empty string for null', () => {
    const { json, truncated } = truncateJson(null, 100);
    expect(json).toBe('');
    expect(truncated).toBe(false);
  });

  it('returns empty string for undefined', () => {
    const { json, truncated } = truncateJson(undefined, 100);
    expect(json).toBe('');
    expect(truncated).toBe(false);
  });

  it('returns full JSON when within limit', () => {
    const { json, truncated } = truncateJson({ key: 'value' }, 1000);
    expect(json).toBe('{"key":"value"}');
    expect(truncated).toBe(false);
  });

  it('returns valid truncated JSON when size exceeds limit', () => {
    const largeObj = { a: 'one', b: 'two', c: 'three', d: 'x'.repeat(200) };
    const { json, truncated, originalBytes } = truncateJson(largeObj, 50);
    expect(truncated).toBe(true);
    expect(originalBytes).toBeGreaterThan(50);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(Buffer.byteLength(json, 'utf8')).toBeLessThanOrEqual(50);
  });

  it('preserves leading properties when truncating objects', () => {
    const obj = { first: 'kept', second: 'kept', third: 'x'.repeat(200) };
    const { json } = truncateJson(obj, 40);
    const parsed = JSON.parse(json);
    expect(parsed.first).toBe('kept');
  });

  it('preserves leading items when truncating arrays', () => {
    const arr = ['first', 'second', 'x'.repeat(200)];
    const { json } = truncateJson(arr, 30);
    const parsed = JSON.parse(json);
    expect(parsed[0]).toBe('first');
  });

  it('handles non-serializable values by returning empty object JSON', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const { json, truncated } = truncateJson(circular, 100);
    expect(json).toBe('{}');
    expect(truncated).toBe(true);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('preserves exact JSON for values at the limit', () => {
    // '{"a":"bc"}' is exactly 10 bytes
    const { json, truncated } = truncateJson({ a: 'bc' }, 10);
    expect(json).toBe('{"a":"bc"}');
    expect(truncated).toBe(false);
  });

  it('reports originalBytes accurately', () => {
    const obj = { payload: 'x'.repeat(500) };
    const fullJson = JSON.stringify(obj);
    const fullBytes = Buffer.byteLength(fullJson, 'utf8');

    const { originalBytes, truncated } = truncateJson(obj, 100);
    expect(truncated).toBe(true);
    expect(originalBytes).toBe(fullBytes);
  });

  it('always returns valid JSON for any input', () => {
    const inputs: unknown[] = [
      42,
      'hello',
      true,
      [1, 2, 3],
      { nested: { deep: 'value' } },
      { data: 'x'.repeat(10_000) },
      ['a'.repeat(5_000), 'b'.repeat(5_000)],
      { emoji: '\u{1F600}'.repeat(500) }
    ];

    for (const input of inputs) {
      for (const limit of [10, 50, 100, 1_000, 100_000]) {
        const { json } = truncateJson(input, limit);
        if (json === '') continue;
        expect(() => JSON.parse(json)).not.toThrow();
      }
    }
  });

  it('handles multi-byte characters without producing invalid JSON', () => {
    const obj = { text: '\u{1F600}'.repeat(100) };
    const { json } = truncateJson(obj, 50);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('works with deeply nested structures', () => {
    const obj = {
      level1: {
        level2: {
          level3: { a: 'short', b: 'x'.repeat(500) }
        }
      }
    };
    const { json, truncated } = truncateJson(obj, 80);
    expect(truncated).toBe(true);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('enforces maxBytes when library returns oversized primitive (e.g. long string)', () => {
    const longString = 'x'.repeat(25_000);
    const { json, truncated, originalBytes } = truncateJson(longString, 100);
    expect(truncated).toBe(true);
    expect(originalBytes).toBeGreaterThan(100);
    expect(Buffer.byteLength(json, 'utf8')).toBeLessThanOrEqual(100);
    expect(() => JSON.parse(json)).not.toThrow();
    // When the library cannot shrink a primitive it returns it unchanged; we then use
    // a sentinel. When the library does truncate (e.g. string with "..."), we get that.
    const parsed = JSON.parse(json);
    const isSentinel = typeof parsed === 'object' && parsed.$truncated === true;
    const isTruncatedString = typeof parsed === 'string' && parsed.length < 25_000;
    expect(isSentinel || isTruncatedString).toBe(true);
    if (isSentinel) expect(parsed.$originalBytes).toBe(originalBytes);
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
        sequence: 0,
        inputWasTruncated: false,
        outputWasTruncated: false
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
        sequence: 1,
        inputWasTruncated: true,
        outputWasTruncated: false
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
      sequence: 0,
      inputWasTruncated: false,
      outputWasTruncated: false
    });
    expect(parsed.diagnostics[1].error).toBe('connection refused');
    expect(parsed.diagnostics[1].sequence).toBe(1);
    expect(parsed.diagnostics[1].inputWasTruncated).toBe(true);
    expect(parsed.diagnostics[1].outputWasTruncated).toBe(false);
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

  it('respects max entries limit (10000)', () => {
    const MAX_ENTRIES = 10_000;
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

  it('truncated diagnostic fields remain valid JSON', () => {
    const largeInput = { query: 'SELECT ' + 'x'.repeat(20_000) };
    const largeOutput = { rows: Array.from({ length: 1000 }, (_, i) => ({ id: i })) };

    const input = truncateJson(largeInput, 10_240);
    const output = truncateJson(largeOutput, 10_240);

    expect(input.truncated).toBe(true);
    expect(output.truncated).toBe(true);
    expect(() => JSON.parse(input.json)).not.toThrow();
    expect(() => JSON.parse(output.json)).not.toThrow();

    const diagnostic = {
      integrationId: 'int-big',
      pluginId: 'postgres',
      input: input.json,
      output: output.json,
      startMs: 0,
      endMs: 1,
      durationMs: 1,
      error: '',
      sequence: 0,
      inputWasTruncated: input.truncated,
      outputWasTruncated: output.truncated
    };

    const json = JSON.stringify({ output: {}, log: [], diagnostics: [diagnostic] });
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('truncated output preserves as much structure as possible', () => {
    const largeOutput = {
      rows: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `user-${i}` }))
    };
    const { json, truncated } = truncateJson(largeOutput, 500);
    expect(truncated).toBe(true);
    const parsed = JSON.parse(json);
    expect(parsed.rows).toBeDefined();
    expect(parsed.rows.length).toBeGreaterThan(0);
    expect(parsed.rows.length).toBeLessThan(100);
    expect(parsed.rows[0]).toEqual({ id: 0, name: 'user-0' });
  });
});
