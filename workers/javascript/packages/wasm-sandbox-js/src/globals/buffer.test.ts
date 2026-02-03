import { describe, expect, it } from '@jest/globals';
import { createSandbox } from '../sandbox';
import { hostFunction } from '../marshal';

describe('globals/buffer', () => {
  describe('Buffer.from with strings', () => {
    it('creates a Buffer from a UTF-8 string (default encoding)', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from("hello"))');
        // "hello" in UTF-8 is [104, 101, 108, 108, 111]
        expect(result).toEqual([104, 101, 108, 108, 111]);
      } finally {
        sandbox.dispose();
      }
    });

    it('creates a Buffer from a base64 string', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from("aGVsbG8=", "base64"))');
        // "aGVsbG8=" is "hello" in base64
        expect(result).toEqual([104, 101, 108, 108, 111]);
      } finally {
        sandbox.dispose();
      }
    });

    it('creates a Buffer from a hex string', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from("68656c6c6f", "hex"))');
        // "68656c6c6f" is "hello" in hex
        expect(result).toEqual([104, 101, 108, 108, 111]);
      } finally {
        sandbox.dispose();
      }
    });

    it('creates a Buffer from a binary/latin1 string', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const binaryResult = await sandbox.evaluate('Array.from(Buffer.from("hello", "binary"))');
        const latin1Result = await sandbox.evaluate('Array.from(Buffer.from("hello", "latin1"))');
        // binary and latin1 are aliases - each character's charCode becomes a byte
        expect(binaryResult).toEqual([104, 101, 108, 108, 111]);
        expect(latin1Result).toEqual([104, 101, 108, 108, 111]);
      } finally {
        sandbox.dispose();
      }
    });

    it('handles binary encoding with high byte values', async () => {
      // Test with characters that have code points > 127
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from("\\xff\\xfe", "binary"))');
        expect(result).toEqual([255, 254]);
      } finally {
        sandbox.dispose();
      }
    });

    it('enforces memory limit during host string encoding', async () => {
      const sandbox = await createSandbox({
        enableBuffer: true,
        limits: { memoryBytes: 256 * 1024 }
      });
      try {
        // "中" is 3 bytes in UTF-8, but 2 bytes per code unit in JS strings. This lets the VM allocate the
        // source string within the limit while UTF-8 conversion for host encoding exceeds it.
        await expect(sandbox.evaluate('Buffer.from("中".repeat(90000))')).rejects.toThrow(
          /Buffer\.from\(string\): (failed to read string from VM|encoded size)/
        );
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('Buffer.from with arrays and TypedArrays', () => {
    it('creates a Buffer from an array of bytes', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from([104, 101, 108, 108, 111]))');
        expect(result).toEqual([104, 101, 108, 108, 111]);
      } finally {
        sandbox.dispose();
      }
    });

    it('creates a Buffer from a Uint8Array', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from(new Uint8Array([1, 2, 3])))');
        expect(result).toEqual([1, 2, 3]);
      } finally {
        sandbox.dispose();
      }
    });

    it('creates a Buffer from an ArrayBuffer', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Array.from(Buffer.from(new Uint8Array([1, 2, 3, 4, 5]).buffer))');
        expect(result).toEqual([1, 2, 3, 4, 5]);
      } finally {
        sandbox.dispose();
      }
    });

    it('creates a Buffer from an ArrayBuffer with byteOffset and length', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        // Create ArrayBuffer with [1, 2, 3, 4, 5], then slice from offset 1 with length 3
        const result = await sandbox.evaluate('Array.from(Buffer.from(new Uint8Array([1, 2, 3, 4, 5]).buffer, 1, 3))');
        expect(result).toEqual([2, 3, 4]);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('Buffer.isBuffer', () => {
    it('returns true for Buffer instances', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.isBuffer(Buffer.from("test"))');
        expect(result).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns false for Uint8Array instances', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.isBuffer(new Uint8Array([1, 2, 3]))');
        expect(result).toBe(false);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns false for plain objects', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.isBuffer({})');
        expect(result).toBe(false);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns false for arrays', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.isBuffer([1, 2, 3])');
        expect(result).toBe(false);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns false for strings', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.isBuffer("hello")');
        expect(result).toBe(false);
      } finally {
        sandbox.dispose();
      }
    });

    it('returns false for null and undefined', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const nullResult = await sandbox.evaluate('Buffer.isBuffer(null)');
        const undefinedResult = await sandbox.evaluate('Buffer.isBuffer(undefined)');
        expect(nullResult).toBe(false);
        expect(undefinedResult).toBe(false);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('Buffer inheritance', () => {
    it('Buffer is instanceof Uint8Array', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("test") instanceof Uint8Array');
        expect(result).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });

    it('Buffer has Uint8Array methods', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        // Test that Buffer instances can use Uint8Array methods
        const result = await sandbox.evaluate('Buffer.from([1, 2, 3]).slice(1, 3).length');
        expect(result).toBe(2);
      } finally {
        sandbox.dispose();
      }
    });

    it('Buffer has correct length property', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello").length');
        expect(result).toBe(5);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('Buffer.toString', () => {
    it('converts buffer to UTF-8 string by default', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello").toString()');
        expect(result).toBe('hello');
      } finally {
        sandbox.dispose();
      }
    });

    it('converts buffer to UTF-8 string with explicit encoding', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello").toString("utf-8")');
        expect(result).toBe('hello');
      } finally {
        sandbox.dispose();
      }
    });

    it('converts buffer to base64 string', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello").toString("base64")');
        expect(result).toBe('aGVsbG8=');
      } finally {
        sandbox.dispose();
      }
    });

    it('converts buffer to hex string', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello").toString("hex")');
        expect(result).toBe('68656c6c6f');
      } finally {
        sandbox.dispose();
      }
    });

    it('converts buffer to binary/latin1 string', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const binaryResult = await sandbox.evaluate('Buffer.from([255, 254, 253]).toString("binary")');
        const latin1Result = await sandbox.evaluate('Buffer.from([255, 254, 253]).toString("latin1")');
        expect(binaryResult).toBe('\xff\xfe\xfd');
        expect(latin1Result).toBe('\xff\xfe\xfd');
      } finally {
        sandbox.dispose();
      }
    });

    it('supports start and end parameters', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello world").toString("utf-8", 0, 5)');
        expect(result).toBe('hello');
      } finally {
        sandbox.dispose();
      }
    });

    it('supports start parameter only', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("hello world").toString("utf-8", 6)');
        expect(result).toBe('world');
      } finally {
        sandbox.dispose();
      }
    });

    it('roundtrips base64 encoding correctly', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        // Create buffer from string, encode to base64, decode back
        const result = await sandbox.evaluate(`
          (() => {
            const original = "Hello, World!";
            const encoded = Buffer.from(original).toString("base64");
            const decoded = Buffer.from(encoded, "base64").toString("utf-8");
            return decoded === original;
          })()
        `);
        expect(result).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });

    it('roundtrips hex encoding correctly', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate(`
          (() => {
            const original = "Hello, World!";
            const encoded = Buffer.from(original).toString("hex");
            const decoded = Buffer.from(encoded, "hex").toString("utf-8");
            return decoded === original;
          })()
        `);
        expect(result).toBe(true);
      } finally {
        sandbox.dispose();
      }
    });

    it('handles empty buffer', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from([]).toString()');
        expect(result).toBe('');
      } finally {
        sandbox.dispose();
      }
    });

    it('handles unicode characters', async () => {
      const sandbox = await createSandbox({ enableBuffer: true });
      try {
        const result = await sandbox.evaluate('Buffer.from("δοκιμή 你好世界").toString()');
        expect(result).toBe('δοκιμή 你好世界');
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('Buffer disabled by default', () => {
    it('throws ReferenceError when Buffer is used without enabling it', async () => {
      const sandbox = await createSandbox();
      try {
        await expect(sandbox.evaluate('Buffer.from("test")')).rejects.toThrow(/Buffer.*not defined/i);
      } finally {
        sandbox.dispose();
      }
    });
  });

  describe('Buffer marshalling (VM <-> Host)', () => {
    describe('VM to Host', () => {
      it('extracts Buffer from VM as Node.js Buffer', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const result = await sandbox.evaluate('Buffer.from("hello")');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect(result).toEqual(Buffer.from('hello'));
        } finally {
          sandbox.dispose();
        }
      });

      it('extracts Buffer with binary data from VM', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const result = await sandbox.evaluate('Buffer.from([0, 127, 128, 255])');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect(Array.from(result as Buffer)).toEqual([0, 127, 128, 255]);
        } finally {
          sandbox.dispose();
        }
      });

      it('extracts Buffer nested in object', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const result = (await sandbox.evaluate('({ data: Buffer.from("test"), type: "buffer" })')) as {
            data: Buffer;
            type: string;
          };
          expect(Buffer.isBuffer(result.data)).toBe(true);
          expect(result.data).toEqual(Buffer.from('test'));
          expect(result.type).toBe('buffer');
        } finally {
          sandbox.dispose();
        }
      });

      it('extracts Buffer nested in array', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const result = (await sandbox.evaluate('[Buffer.from("a"), Buffer.from("b")]')) as Buffer[];
          expect(result).toHaveLength(2);
          expect(Buffer.isBuffer(result[0])).toBe(true);
          expect(Buffer.isBuffer(result[1])).toBe(true);
          expect(result[0]).toEqual(Buffer.from('a'));
          expect(result[1]).toEqual(Buffer.from('b'));
        } finally {
          sandbox.dispose();
        }
      });

      it('extracts empty Buffer', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const result = await sandbox.evaluate('Buffer.from([])');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect((result as Buffer).length).toBe(0);
        } finally {
          sandbox.dispose();
        }
      });
    });

    describe('Host to VM', () => {
      it('passes Node.js Buffer to VM as Buffer', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          sandbox.setGlobals({ buf: Buffer.from('hello') });
          const result = await sandbox.evaluate('Buffer.isBuffer(buf)');
          expect(result).toBe(true);
        } finally {
          sandbox.dispose();
        }
      });

      it('passes Buffer and allows byte access in VM', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          sandbox.setGlobals({ buf: Buffer.from([1, 2, 3, 4, 5]) });
          const result = await sandbox.evaluate('Array.from(buf)');
          expect(result).toEqual([1, 2, 3, 4, 5]);
        } finally {
          sandbox.dispose();
        }
      });

      it('passes Buffer nested in object to VM', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          sandbox.setGlobals({ obj: { data: Buffer.from('test') } });
          const result = await sandbox.evaluate('[Buffer.isBuffer(obj.data), Array.from(obj.data)]');
          expect(result).toEqual([true, [116, 101, 115, 116]]);
        } finally {
          sandbox.dispose();
        }
      });

      it('passes Buffer nested in array to VM', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          sandbox.setGlobals({ buffers: [Buffer.from('a'), Buffer.from('b')] });
          const result = await sandbox.evaluate('buffers.map(b => Buffer.isBuffer(b))');
          expect(result).toEqual([true, true]);
        } finally {
          sandbox.dispose();
        }
      });

      it('throws when passing Buffer without enableBuffer', async () => {
        const sandbox = await createSandbox();
        try {
          expect(() => {
            sandbox.setGlobals({ buf: Buffer.from('hello') });
          }).toThrow(/Buffer.*not enabled/i);
        } finally {
          sandbox.dispose();
        }
      });
    });

    describe('Roundtrip (Host -> VM -> Host)', () => {
      it('roundtrips Buffer through VM unchanged', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const original = Buffer.from('hello world');
          sandbox.setGlobals({ buf: original });
          const result = await sandbox.evaluate('buf');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect(result).toEqual(original);
        } finally {
          sandbox.dispose();
        }
      });

      it('allows VM to modify Buffer and return result', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          sandbox.setGlobals({ buf: Buffer.from('hello') });
          const result = await sandbox.evaluate(`
            (() => {
              const newBuf = Buffer.from(buf);
              newBuf[0] = 72; // 'H'
              return newBuf;
            })()
          `);
          expect(Buffer.isBuffer(result)).toBe(true);
          expect((result as Buffer).toString()).toBe('Hello');
        } finally {
          sandbox.dispose();
        }
      });

      it('passes Buffer through host function and back', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const transform = (buf: Buffer): Buffer => {
            return Buffer.from(buf.map((b) => b + 1));
          };
          sandbox.setGlobals({ transform: hostFunction(transform) });
          const result = await sandbox.evaluate('transform(Buffer.from([1, 2, 3]))');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect(Array.from(result as Buffer)).toEqual([2, 3, 4]);
        } finally {
          sandbox.dispose();
        }
      });

      it('roundtrips empty Buffer', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          const original = Buffer.from([]);
          sandbox.setGlobals({ buf: original });
          const result = await sandbox.evaluate('buf');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect((result as Buffer).length).toBe(0);
        } finally {
          sandbox.dispose();
        }
      });

      it('roundtrips Buffer with full byte range', async () => {
        const sandbox = await createSandbox({ enableBuffer: true });
        try {
          // Test all possible byte values 0-255
          const original = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
          sandbox.setGlobals({ buf: original });
          const result = await sandbox.evaluate('buf');
          expect(Buffer.isBuffer(result)).toBe(true);
          expect(result).toEqual(original);
        } finally {
          sandbox.dispose();
        }
      });
    });
  });
});
