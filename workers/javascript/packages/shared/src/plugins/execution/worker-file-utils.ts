/**
 * Shared file-fetching utilities for WASM worker bootstraps.
 *
 * Provides `fetchFromController` (HTTP file retrieval from the orchestrator's
 * file server) and `prepareGlobalsWithFileMethods` (attaches readContents /
 * readContentsAsync host functions to file globals).
 *
 * Used by both javascript-wasm and javascript-sdk-api-wasm bootstrap modules.
 */

import * as http from 'node:http';
import { promisify } from 'node:util';
import deasync from 'deasync';
import _ from 'lodash';
import { serialize } from './utils';
import type { FileFetcher } from './types';

/**
 * Fetch a file from the controller's file server.
 * Uses fileServerUrl and agentKey from context.globals for authentication.
 */
export function fetchFromController(
  fileServerUrl: string,
  agentKey: string,
  location: string,
  callback: (err: Error | null, result: Buffer | null) => void
): void {
  const url = new URL(fileServerUrl);
  url.searchParams.set('location', location);
  http.get(
    url.toString(),
    {
      headers: { 'x-superblocks-agent-key': agentKey }
    },
    (response) => {
      if (response.statusCode != 200) {
        return callback(new Error('Internal Server Error'), null);
      }
      const chunks: Buffer[] = [];
      let chunkStrings = '';
      response.on('data', (chunk: Buffer) => {
        if (fileServerUrl.includes('v2')) {
          const serialized = serialize(chunk);
          chunkStrings += serialized;
        } else {
          chunks.push(chunk);
        }
      });
      response.on('error', (err) => callback(err, null));
      response.on('end', () => {
        if (fileServerUrl.includes('v2')) {
          const processed = chunkStrings
            .split('\n')
            .filter((str) => str.length > 0)
            .map((str) => {
              const json = JSON.parse(str);
              const data = json.result?.data;
              if (data == null) {
                throw new Error('fetchFile response missing data');
              }
              return Buffer.from(data, 'base64');
            });
          // Cast needed: TS 5.6+ made Uint8Array generic, causing type incompatibility with Buffer
          callback(null, Buffer.concat(processed as unknown as Uint8Array[]));
        } else {
          // Cast needed: TS 5.6+ made Uint8Array generic, causing type incompatibility with Buffer
          // even though Buffer extends Uint8Array at runtime. Fixed in @types/node@25+ (Node 25).
          callback(null, Buffer.concat(chunks as unknown as Uint8Array[]));
        }
      });
    }
  );
}

/** Type of the `hostFunction` wrapper from @superblocks/wasm-sandbox-js. */
type HostFunctionWrapper = typeof import('@superblocks/wasm-sandbox-js').hostFunction;

/**
 * Attaches readContents / readContentsAsync host functions to file globals.
 *
 * For each file in `filePaths`, this creates sync and async read methods and
 * sets them on the corresponding global entry. The methods are wrapped with
 * `wrapHostFn` so they can be called from inside the QuickJS WASM sandbox.
 *
 * @param globals - The globals object to mutate
 * @param filePaths - Map of tree path to disk path for each file
 * @param fetcher - The file fetcher configuration (controller or sandbox)
 * @param wrapHostFn - Function that wraps a JS function for use as a WASM host function
 */
export function prepareGlobalsWithFileMethods(
  globals: Record<string, unknown>,
  filePaths: Record<string, string>,
  fetcher: FileFetcher,
  wrapHostFn: HostFunctionWrapper
): void {
  Object.entries(filePaths).forEach(([treePath, diskPath]) => {
    if (!diskPath) return;

    let readContentsAsync: (mode?: 'raw' | 'binary' | 'text' | unknown) => Promise<string | Buffer>;
    let readContents: (mode?: 'raw' | 'binary' | 'text' | unknown) => string | Buffer;

    if (fetcher.type === 'controller') {
      readContentsAsync = async (mode?: 'raw' | 'binary' | 'text' | unknown): Promise<string | Buffer> => {
        const contents = await promisify(fetchFromController)(fetcher.fileServerUrl, fetcher.agentKey, diskPath);
        return serialize(contents, mode);
      };

      readContents = (mode?: 'raw' | 'binary' | 'text' | unknown): string | Buffer => {
        const contents = deasync(fetchFromController)(fetcher.fileServerUrl, fetcher.agentKey, diskPath);
        return serialize(contents, mode);
      };
    } else {
      const { client } = fetcher;
      const fetchFileCallback = (path: string, cb: (err: Error | null, result: Buffer | null) => void): void => {
        client.fetchFileCallback?.(path, cb);
      };

      readContentsAsync = async (mode?: 'raw' | 'binary' | 'text' | unknown): Promise<string | Buffer> => {
        const contents = await promisify(fetchFileCallback)(diskPath);
        return serialize(contents, mode);
      };

      readContents = (mode?: 'raw' | 'binary' | 'text' | unknown): string | Buffer => {
        const contents = deasync(fetchFileCallback)(diskPath);
        return serialize(contents, mode);
      };
    }

    const file = _.get(globals, treePath) as object | undefined;
    // Leaving $superblocksId set because it's required by our S3.
    _.set(globals, treePath, {
      ...file,
      previewUrl: undefined,
      readContentsAsync: wrapHostFn(readContentsAsync),
      readContents: wrapHostFn(readContents)
    });
  });
}
