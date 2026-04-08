import { Buffer } from 'buffer';
import { Readable } from 'stream';

import axios from 'axios';
import type { Request } from 'express';

import { AGENT_KEY_HEADER, ExecutionContext } from '../../types';

export type RequestFile = Request['file'];
export type RequestFiles = Request['files'];

export async function getFileStream(context: ExecutionContext, location: string): Promise<Readable> {
  if (
    context.kvStore == undefined ||
    context.kvStore.fetchFileCallback == undefined ||
    typeof context.kvStore.fetchFileCallback !== 'function'
  ) {
    return await getFileStreamLegacy(context, location);
  }

  return Readable.from(await getFileBuffer(context, location));
}

export async function getFileBuffer(context: ExecutionContext, location: string): Promise<Buffer> {
  if (
    context.kvStore == undefined ||
    context.kvStore.fetchFileCallback == undefined ||
    typeof context.kvStore.fetchFileCallback !== 'function'
  ) {
    return await getFileBufferLegacy(context, location);
  }

  return new Promise<Buffer>((resolve, reject) => {
    context.kvStore.fetchFileCallback(location, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function getEncodedFile(context: ExecutionContext, location: string, encoding: BufferEncoding): Promise<string> {
  const _buffer = await getFileBuffer(context, location);
  return _buffer.toString(encoding);
}

async function getFileStreamLegacy(context: ExecutionContext, location: string): Promise<Readable> {
  const fileServerUrl = context.globals['$fileServerUrl'] as string;
  const headers = {};
  headers[AGENT_KEY_HEADER] = context.globals['$agentKey'];

  const response = await axios.get(`${context.globals['$fileServerUrl']}?location=${encodeURIComponent(location)}`, {
    headers,
    responseType: 'stream'
  });

  if (fileServerUrl.includes('v2')) {
    return new Promise((resolve, reject) => {
      let chunkStrings = '';
      response.data.on('data', (chunk) => {
        const serialized = chunk.toString('utf-8');
        chunkStrings += serialized;
      });
      response.data.on('end', () => {
        const chunks = chunkStrings
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
        resolve(Readable.from(Buffer.concat(chunks)));
      });
      response.data.on('error', (err) => reject(err));
    });
  } else {
    return response.data;
  }
}

async function getFileBufferLegacy(context: ExecutionContext, location: string): Promise<Buffer> {
  const stream = await getFileStreamLegacy(context, location);

  return await new Promise<Buffer>((resolve, reject) => {
    const _buffer = Array<Uint8Array>();

    stream.on('data', (chunk) => _buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buffer)));
    stream.on('error', (err) => reject(err));
  });
}
