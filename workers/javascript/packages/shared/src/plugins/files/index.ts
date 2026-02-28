import { Buffer } from 'buffer';
import { Readable } from 'stream';
import axios from 'axios';
import { AGENT_KEY_HEADER, ExecutionContext } from '../../types';
import type { Request } from 'express';

export type RequestFile = Request['file'];
export type RequestFiles = Request['files'];

export async function getFileStream(context: ExecutionContext, location: string): Promise<Readable> {
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

export async function getFileBuffer(context: ExecutionContext, location: string): Promise<Buffer> {
  const stream = await getFileStream(context, location);

  return await new Promise<Buffer>((resolve, reject) => {
    const _buffer = Array<Uint8Array>();

    stream.on('data', (chunk) => _buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buffer)));
    stream.on('error', (err) => reject(err));
  });
}

export async function getEncodedFile(context: ExecutionContext, location: string, encoding: BufferEncoding): Promise<string> {
  const _buffer = await getFileBuffer(context, location);
  return _buffer.toString(encoding);
}
