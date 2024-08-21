import iconv from 'iconv-lite';
import MIMEType from 'whatwg-mimetype';
import { ActionResponseType } from '../types';

const TEXT_MIME_TYPES = new Set([
  // no need to include text/* types
  'application/json',
  'application/xml',
  'application/xhtml+xml'
]);

export type BufferJSON = {
  type: 'Buffer';
  data: number[];
};

export function decodeResponseText(rawResponseBody: Buffer, encoding = 'utf-8'): string {
  return iconv.decode(rawResponseBody, encoding);
}

export async function bufferFromReadableStream(stream: ReadableStream): Promise<Buffer> {
  const chunks: Array<Uint8Array> = [];

  // @ts-ignore
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

export function extractResponseData(dataBuffer: Buffer, mineTypeString: string, responseType: ActionResponseType): string | BufferJSON {
  const mimeType = new MIMEType(mineTypeString);
  const encoding = mimeType.parameters.get('charset');
  switch (responseType) {
    case ActionResponseType.BINARY:
      return dataBuffer.toJSON();
    case ActionResponseType.TEXT:
    case ActionResponseType.RAW:
      return decodeResponseText(dataBuffer, encoding);
    case ActionResponseType.JSON:
      return JSON.parse(decodeResponseText(dataBuffer, encoding ?? 'utf-8'));
    case ActionResponseType.AUTO: {
      if (encoding || mimeType.type === 'text' || TEXT_MIME_TYPES.has(mimeType.essence)) {
        const dataText = decodeResponseText(dataBuffer, encoding);
        try {
          return JSON.parse(dataText);
        } catch {
          return dataText;
        }
      } else {
        return dataBuffer.toJSON();
      }
    }
  }
}
