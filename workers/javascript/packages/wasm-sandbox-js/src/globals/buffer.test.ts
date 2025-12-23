import { beforeAll, describe, expect, it } from '@jest/globals';
import { evaluateExpressions, prewarmEvaluator } from '../evaluator';
import { hostFunction } from '../marshal';

describe('globals/buffer', () => {
  beforeAll(async () => {
    await prewarmEvaluator();
  });

  describe('Buffer.from with strings', () => {
    it('creates a Buffer from a UTF-8 string (default encoding)', async () => {
      const expression = 'Array.from(Buffer.from("hello"))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      // "hello" in UTF-8 is [104, 101, 108, 108, 111]
      expect(results[expression]).toEqual([104, 101, 108, 108, 111]);
    });

    it('creates a Buffer from a base64 string', async () => {
      const expression = 'Array.from(Buffer.from("aGVsbG8=", "base64"))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      // "aGVsbG8=" is "hello" in base64
      expect(results[expression]).toEqual([104, 101, 108, 108, 111]);
    });

    it('creates a Buffer from a hex string', async () => {
      const expression = 'Array.from(Buffer.from("68656c6c6f", "hex"))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      // "68656c6c6f" is "hello" in hex
      expect(results[expression]).toEqual([104, 101, 108, 108, 111]);
    });

    it('creates a Buffer from a binary/latin1 string', async () => {
      const binaryExpression = 'Array.from(Buffer.from("hello", "binary"))';
      const latin1Expression = 'Array.from(Buffer.from("hello", "latin1"))';
      const results = await evaluateExpressions([binaryExpression, latin1Expression], { enableBuffer: true });

      // binary and latin1 are aliases - each character's charCode becomes a byte
      expect(results[binaryExpression]).toEqual([104, 101, 108, 108, 111]);
      expect(results[latin1Expression]).toEqual([104, 101, 108, 108, 111]);
    });

    it('handles binary encoding with high byte values', async () => {
      // Test with characters that have code points > 127
      const expression = 'Array.from(Buffer.from("\\xff\\xfe", "binary"))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toEqual([255, 254]);
    });

    it('enforces memory limit during host string encoding', async () => {
      // "中" is 3 bytes in UTF-8, but 2 bytes per code unit in JS strings. This lets the VM allocate the
      // source string within the limit while UTF-8 conversion for host encoding exceeds it. We should throw (not silently
      // return an empty Buffer).
      await expect(
        evaluateExpressions(['Buffer.from("中".repeat(90000))'], {
          enableBuffer: true,
          limits: { memoryBytes: 256 * 1024 }
        })
      ).rejects.toThrow(/Buffer\.from\(string\): (failed to read string from VM|encoded size)/);
    });
  });

  describe('Buffer.from with arrays and TypedArrays', () => {
    it('creates a Buffer from an array of bytes', async () => {
      const expression = 'Array.from(Buffer.from([104, 101, 108, 108, 111]))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toEqual([104, 101, 108, 108, 111]);
    });

    it('creates a Buffer from a Uint8Array', async () => {
      const expression = 'Array.from(Buffer.from(new Uint8Array([1, 2, 3])))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toEqual([1, 2, 3]);
    });

    it('creates a Buffer from an ArrayBuffer', async () => {
      const expression = 'Array.from(Buffer.from(new Uint8Array([1, 2, 3, 4, 5]).buffer))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toEqual([1, 2, 3, 4, 5]);
    });

    it('creates a Buffer from an ArrayBuffer with byteOffset and length', async () => {
      // Create ArrayBuffer with [1, 2, 3, 4, 5], then slice from offset 1 with length 3
      const expression = 'Array.from(Buffer.from(new Uint8Array([1, 2, 3, 4, 5]).buffer, 1, 3))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toEqual([2, 3, 4]);
    });
  });

  describe('Buffer.isBuffer', () => {
    it('returns true for Buffer instances', async () => {
      const expression = 'Buffer.isBuffer(Buffer.from("test"))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(true);
    });

    it('returns false for Uint8Array instances', async () => {
      const expression = 'Buffer.isBuffer(new Uint8Array([1, 2, 3]))';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(false);
    });

    it('returns false for plain objects', async () => {
      const expression = 'Buffer.isBuffer({})';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(false);
    });

    it('returns false for arrays', async () => {
      const expression = 'Buffer.isBuffer([1, 2, 3])';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(false);
    });

    it('returns false for strings', async () => {
      const expression = 'Buffer.isBuffer("hello")';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(false);
    });

    it('returns false for null and undefined', async () => {
      const nullExpression = 'Buffer.isBuffer(null)';
      const undefinedExpression = 'Buffer.isBuffer(undefined)';
      const results = await evaluateExpressions([nullExpression, undefinedExpression], { enableBuffer: true });

      expect(results[nullExpression]).toBe(false);
      expect(results[undefinedExpression]).toBe(false);
    });
  });

  describe('Buffer inheritance', () => {
    it('Buffer is instanceof Uint8Array', async () => {
      const expression = 'Buffer.from("test") instanceof Uint8Array';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(true);
    });

    it('Buffer has Uint8Array methods', async () => {
      // Test that Buffer instances can use Uint8Array methods
      const expression = 'Buffer.from([1, 2, 3]).slice(1, 3).length';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(2);
    });

    it('Buffer has correct length property', async () => {
      const expression = 'Buffer.from("hello").length';
      const results = await evaluateExpressions([expression], { enableBuffer: true });

      expect(results[expression]).toBe(5);
    });
  });

  describe('Buffer disabled by default', () => {
    it('throws ReferenceError when Buffer is used without enabling it', async () => {
      await expect(evaluateExpressions(['Buffer.from("test")'])).rejects.toThrow(/Buffer.*not defined/i);
    });
  });

  describe('Buffer marshalling (VM <-> Host)', () => {
    describe('VM to Host', () => {
      it('extracts Buffer from VM as Node.js Buffer', async () => {
        const expression = 'Buffer.from("hello")';
        const results = await evaluateExpressions([expression], { enableBuffer: true });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect(results[expression]).toEqual(Buffer.from('hello'));
      });

      it('extracts Buffer with binary data from VM', async () => {
        const expression = 'Buffer.from([0, 127, 128, 255])';
        const results = await evaluateExpressions([expression], { enableBuffer: true });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect(Array.from(results[expression] as Buffer)).toEqual([0, 127, 128, 255]);
      });

      it('extracts Buffer nested in object', async () => {
        const expression = '({ data: Buffer.from("test"), type: "buffer" })';
        const results = await evaluateExpressions([expression], { enableBuffer: true });

        const result = results[expression] as { data: Buffer; type: string };
        expect(Buffer.isBuffer(result.data)).toBe(true);
        expect(result.data).toEqual(Buffer.from('test'));
        expect(result.type).toBe('buffer');
      });

      it('extracts Buffer nested in array', async () => {
        const expression = '[Buffer.from("a"), Buffer.from("b")]';
        const results = await evaluateExpressions([expression], { enableBuffer: true });

        const result = results[expression] as Buffer[];
        expect(result).toHaveLength(2);
        expect(Buffer.isBuffer(result[0])).toBe(true);
        expect(Buffer.isBuffer(result[1])).toBe(true);
        expect(result[0]).toEqual(Buffer.from('a'));
        expect(result[1]).toEqual(Buffer.from('b'));
      });

      it('extracts empty Buffer', async () => {
        const expression = 'Buffer.from([])';
        const results = await evaluateExpressions([expression], { enableBuffer: true });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect((results[expression] as Buffer).length).toBe(0);
      });
    });

    describe('Host to VM', () => {
      it('passes Node.js Buffer to VM as Buffer', async () => {
        const expression = 'Buffer.isBuffer(buf)';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buf: Buffer.from('hello') }
        });

        expect(results[expression]).toBe(true);
      });

      it('passes Buffer and allows byte access in VM', async () => {
        const expression = 'Array.from(buf)';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buf: Buffer.from([1, 2, 3, 4, 5]) }
        });

        expect(results[expression]).toEqual([1, 2, 3, 4, 5]);
      });

      it('passes Buffer nested in object to VM', async () => {
        const expression = '[Buffer.isBuffer(obj.data), Array.from(obj.data)]';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { obj: { data: Buffer.from('test') } }
        });

        expect(results[expression]).toEqual([true, [116, 101, 115, 116]]);
      });

      it('passes Buffer nested in array to VM', async () => {
        const expression = 'buffers.map(b => Buffer.isBuffer(b))';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buffers: [Buffer.from('a'), Buffer.from('b')] }
        });

        expect(results[expression]).toEqual([true, true]);
      });

      it('throws when passing Buffer without enableBuffer', async () => {
        await expect(
          evaluateExpressions(['buf'], {
            globals: { buf: Buffer.from('hello') }
          })
        ).rejects.toThrow(/Buffer.*not enabled/i);
      });
    });

    describe('Roundtrip (Host -> VM -> Host)', () => {
      it('roundtrips Buffer through VM unchanged', async () => {
        const original = Buffer.from('hello world');
        const expression = 'buf';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buf: original }
        });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect(results[expression]).toEqual(original);
      });

      it('allows VM to modify Buffer and return result', async () => {
        const expression = `
          (() => {
            const newBuf = Buffer.from(buf);
            newBuf[0] = 72; // 'H'
            return newBuf;
          })()
        `;
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buf: Buffer.from('hello') }
        });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect((results[expression] as Buffer).toString()).toBe('Hello');
      });

      it('passes Buffer through host function and back', async () => {
        const transform = (buf: Buffer): Buffer => {
          return Buffer.from(buf.map((b) => b + 1));
        };

        const expression = 'transform(Buffer.from([1, 2, 3]))';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { transform: hostFunction(transform) }
        });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect(Array.from(results[expression] as Buffer)).toEqual([2, 3, 4]);
      });

      it('roundtrips empty Buffer', async () => {
        const original = Buffer.from([]);
        const expression = 'buf';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buf: original }
        });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect((results[expression] as Buffer).length).toBe(0);
      });

      it('roundtrips Buffer with full byte range', async () => {
        // Test all possible byte values 0-255
        const original = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
        const expression = 'buf';
        const results = await evaluateExpressions([expression], {
          enableBuffer: true,
          globals: { buf: original }
        });

        expect(Buffer.isBuffer(results[expression])).toBe(true);
        expect(results[expression]).toEqual(original);
      });
    });
  });
});
