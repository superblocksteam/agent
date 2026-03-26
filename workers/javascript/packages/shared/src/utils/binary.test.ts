import { extractResponseData, decodeResponseText } from './binary';
import { ActionResponseType } from '../types';

describe('extractResponseData', () => {
  const textBuffer = Buffer.from('Hello, world!');
  const jsonBuffer = Buffer.from('{"key":"value"}');
  const textMime = 'text/plain; charset=utf-8';
  const jsonMime = 'application/json';
  const binaryMime = 'application/octet-stream';

  it('returns decoded text for TEXT response type', () => {
    const result = extractResponseData(textBuffer, textMime, ActionResponseType.TEXT);
    expect(result).toBe('Hello, world!');
  });

  it('returns decoded text for RAW response type', () => {
    const result = extractResponseData(textBuffer, textMime, ActionResponseType.RAW);
    expect(result).toBe('Hello, world!');
  });

  it('returns parsed JSON for JSON response type', () => {
    const result = extractResponseData(jsonBuffer, jsonMime, ActionResponseType.JSON);
    expect(result).toEqual({ key: 'value' });
  });

  it('returns buffer JSON for BINARY response type', () => {
    const result = extractResponseData(textBuffer, textMime, ActionResponseType.BINARY);
    expect(result).toEqual({ type: 'Buffer', data: Array.from(textBuffer) });
  });

  describe('AUTO response type', () => {
    it('parses JSON when content-type is application/json', () => {
      const result = extractResponseData(jsonBuffer, jsonMime, ActionResponseType.AUTO);
      expect(result).toEqual({ key: 'value' });
    });

    it('returns text when content-type is text/*', () => {
      const result = extractResponseData(textBuffer, textMime, ActionResponseType.AUTO);
      expect(result).toBe('Hello, world!');
    });

    it('returns buffer JSON for binary content-type', () => {
      const result = extractResponseData(textBuffer, binaryMime, ActionResponseType.AUTO);
      expect(result).toEqual({ type: 'Buffer', data: Array.from(textBuffer) });
    });
  });

  describe('empty/unset responseType (S3 getObject bug)', () => {
    it('defaults to TEXT when responseType is empty string', () => {
      // Proto3 enum default is "" (empty string) when not set by the caller.
      // The S3 plugin passes `actionConfiguration.responseType ?? ActionResponseType.TEXT`
      // but ?? only catches null/undefined, not "". The switch in extractResponseData
      // must handle "" by falling back to TEXT rather than returning undefined.
      const result = extractResponseData(textBuffer, textMime, '' as ActionResponseType);
      expect(result).toBeDefined();
      expect(result).toBe('Hello, world!');
    });

    it('defaults to TEXT when responseType is undefined', () => {
      const result = extractResponseData(textBuffer, textMime, undefined as unknown as ActionResponseType);
      expect(result).toBeDefined();
      expect(result).toBe('Hello, world!');
    });
  });
});

describe('decodeResponseText', () => {
  it('decodes utf-8 by default', () => {
    const result = decodeResponseText(Buffer.from('hello'));
    expect(result).toBe('hello');
  });
});
