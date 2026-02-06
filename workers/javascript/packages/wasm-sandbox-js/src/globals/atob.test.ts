import { describe, expect, it } from '@jest/globals';
import { createSandbox } from '../sandbox';

describe('globals/atob', () => {
  describe('btoa', () => {
    it('encodes a simple ASCII string to Base64', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        const result = await sandbox.evaluate("btoa('hello')");
        expect(result).toBe('aGVsbG8=');
      } finally {
        sandbox.dispose();
      }
    });

    it('encodes an empty string', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        const result = await sandbox.evaluate("btoa('')");
        expect(result).toBe('');
      } finally {
        sandbox.dispose();
      }
    });

    it('encodes a string with special characters in the Latin1 range', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        // Characters with code points in the Latin1 range (i.e. less than 256)
        const result = await sandbox.evaluate("btoa('\\x01\\x7f\\xff')");
        expect(result).toBe(btoa('\x01\x7f\xff'));
      } finally {
        sandbox.dispose();
      }
    });

    it('throws for characters outside the 0-255 range', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        // Multi-byte Unicode character (U+2603 SNOWMAN)
        await expect(sandbox.evaluate("btoa('\\u2603')")).rejects.toThrow();
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('atob', () => {
    it('decodes a Base64 string to a binary string', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        const result = await sandbox.evaluate("atob('aGVsbG8=')");
        expect(result).toBe('hello');
      } finally {
        sandbox.dispose();
      }
    });

    it('decodes an empty string', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        const result = await sandbox.evaluate("atob('')");
        expect(result).toBe('');
      } finally {
        sandbox.dispose();
      }
    });

    it('decodes Base64 without padding', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        // "aGVsbG8" is "hello" without the trailing '=' padding
        const result = await sandbox.evaluate("atob('aGVsbG8')");
        expect(result).toBe(atob('aGVsbG8'));
      } finally {
        sandbox.dispose();
      }
    });

    it('throws for invalid Base64 input', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        await expect(sandbox.evaluate("atob('not valid base64!!!')")).rejects.toThrow();
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('round-trip', () => {
    it('atob(btoa(str)) returns the original string', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        const result = await sandbox.evaluate("atob(btoa('Hello, World!'))");
        expect(result).toBe('Hello, World!');
      } finally {
        sandbox.dispose();
      }
    });

    it('round-trips binary data in the 1-255 range', async () => {
      const sandbox = await createSandbox({ enableAtob: true });
      try {
        // Build a string of byte values 1-255, encode and decode.
        // Starts at 1 because \x00 is truncated by QuickJS's C-string-based getString extraction.
        const result = await sandbox.evaluate(`
          (() => {
            let str = '';
            for (let i = 1; i < 256; i++) str += String.fromCharCode(i);
            return atob(btoa(str)) === str;
          })()
        `);
        expect(result).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('disabled by default', () => {
    it('atob is not defined when enableAtob is not set', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate("atob('aGVsbG8=')")).rejects.toThrow(/atob.*not defined/i);
      } finally {
        sandbox.dispose();
      }
    });

    it('btoa is not defined when enableAtob is not set', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate("btoa('hello')")).rejects.toThrow(/btoa.*not defined/i);
      } finally {
        sandbox.dispose();
      }
    });
  });
});
