/**
 * Tests for the requireRoot fix (VMError: Cannot find module '@superblocksteam/sdk-api').
 *
 * The server's esbuild bundle keeps @superblocksteam/sdk-api as external, so the
 * VM2 sandbox must resolve it via requireRoot. These tests verify:
 * - buildRequireRoot returns paths from which sdk-api can be resolved
 * - executeCode with requireRoot successfully runs code that requires sdk-api
 */
import { describe, expect, it } from '@jest/globals';
import { ExecutionContext, KVStore, VariableType } from '@superblocks/shared';

import { buildRequireRoot } from './buildRequireRoot';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { executeCode } = require('@superblocksteam/javascript/bootstrap');

function createMockKVStore(): KVStore {
  const store: Record<string, unknown> = {};
  return {
    read: async (keys: string[]) =>
      Promise.resolve({ data: keys.map((k) => store[k]) }),
    write: async (key: string, value: unknown) => {
      store[key] = value;
      return Promise.resolve();
    },
    writeMany: async (payload: Array<{ key: string; value: unknown }>) => {
      for (const { key, value } of payload) {
        store[key] = value;
      }
      return Promise.resolve();
    }
  };
}

describe('requireRoot fix for @superblocksteam/sdk-api', () => {
  describe('buildRequireRoot', () => {
    it('returns array including process.cwd()', () => {
      const roots = buildRequireRoot();
      expect(roots).toContain(process.cwd());
    });

    it('includes path from which @superblocksteam/sdk-api can be resolved', () => {
      const roots = buildRequireRoot();
      expect(roots.length).toBeGreaterThanOrEqual(1);
      // At least one root should allow resolving sdk-api
      const path = require('path');
      for (const root of roots) {
        try {
          const pkgPath = require.resolve('@superblocksteam/sdk-api/package.json', {
            paths: [root]
          });
          expect(pkgPath).toBeTruthy();
          expect(path.isAbsolute(pkgPath)).toBe(true);
          return;
        } catch {
          continue;
        }
      }
      throw new Error('No requireRoot path can resolve @superblocksteam/sdk-api');
    });
  });

  describe('executeCode with requireRoot', () => {
    it('VM2 sandbox can require @superblocksteam/sdk-api when requireRoot is set', async () => {
      const mockStore = createMockKVStore();
      await mockStore.write('_dummy', 'x');

      const context = new ExecutionContext();
      context.variables = {
        _dummy: {
          key: '_dummy',
          type: VariableType.Native,
          mode: 'read'
        }
      };
      context.kvStore = mockStore;
      context.outputs = {};
      context.globals = {};

      const code = `
        var sdk = require("@superblocksteam/sdk-api");
        if (!sdk.api || !sdk.z) {
          throw new Error("sdk-api missing api or z");
        }
        return "sdk-api-resolved";
      `;

      const result = await executeCode({
        context,
        code,
        filePaths: {},
        inheritedEnv: [],
        requireRoot: buildRequireRoot()
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe('sdk-api-resolved');
    });
  });
});
