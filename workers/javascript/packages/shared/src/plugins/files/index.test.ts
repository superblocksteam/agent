import axios from 'axios';
import type { KVStore } from '../../types/api/execution';
import { ExecutionContext } from '../../types/api';
import { getEncodedFile, getFileBuffer, getFileStream } from './index';

jest.mock('fs');
jest.mock('axios');
axios.get = jest.fn().mockImplementation(() => Promise.resolve({ data: 'mock data' }));

const fileServerUrl = 'http://localhost:8080/files';
const location = 'location_with_+_character';

function baseContext(): ExecutionContext {
  const ctx = new ExecutionContext();
  ctx.addGlobalVariable('$agentKey', 'fake-key');
  ctx.addGlobalVariable('$fileServerUrl', fileServerUrl);
  return ctx;
}

function contextWithFetchProxy(fetchFileCallback: NonNullable<KVStore['fetchFileCallback']>): ExecutionContext {
  const ctx = baseContext();
  ctx.kvStore = {
    read: jest.fn(),
    write: jest.fn(),
    writeMany: jest.fn(),
    fetchFileCallback
  };
  return ctx;
}

beforeEach(() => {
  jest.mocked(axios.get).mockClear();
});

describe('getFileStream', () => {
  it('Test encoded query', async () => {
    const context = baseContext();
    context.addGlobalVariable('$flagWorker', true);
    await getFileStream(context, location);

    const encodedLocation = 'location_with_%2B_character';
    const expectedUrl = `${context.globals['$fileServerUrl']}?location=${encodedLocation}`;
    const expectedHeader = {
      headers: {
        'x-superblocks-agent-key': 'fake-key'
      },
      responseType: 'stream'
    };

    expect(axios.get).toHaveBeenCalledWith(expectedUrl, expectedHeader);
  });

  it('uses fetchFileCallback when kvStore proxies through task-manager (sandbox)', async () => {
    const expected = Buffer.from('proxied-bytes');
    const sandboxContext = contextWithFetchProxy((path, cb) => {
      expect(path).toBe(location);
      cb(null, expected);
    });

    const stream = await getFileStream(sandboxContext, location);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }

    expect(Buffer.concat(chunks as unknown as readonly Uint8Array[])).toEqual(expected);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('rejects when fetchFileCallback passes an error', async () => {
    const sandboxContext = contextWithFetchProxy((path, cb) => {
      cb(new Error('fetch failed'), null);
    });

    await expect(getFileStream(sandboxContext, location)).rejects.toThrow('fetch failed');
    expect(axios.get).not.toHaveBeenCalled();
  });
});

describe('getFileBuffer', () => {
  it('uses fetchFileCallback without calling axios', async () => {
    const expected = Buffer.from([0, 1, 2, 255]);
    const sandboxContext = contextWithFetchProxy((path, cb) => {
      expect(path).toBe(location);
      cb(null, expected);
    });

    const buf = await getFileBuffer(sandboxContext, location);
    expect(buf).toEqual(expected);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('rejects when fetchFileCallback passes an error', async () => {
    const sandboxContext = contextWithFetchProxy((_path, cb) => {
      cb(new Error('grpc unavailable'), null);
    });

    await expect(getFileBuffer(sandboxContext, location)).rejects.toThrow('grpc unavailable');
    expect(axios.get).not.toHaveBeenCalled();
  });
});

describe('getEncodedFile', () => {
  it('uses fetchFileCallback and returns utf8 string', async () => {
    const sandboxContext = contextWithFetchProxy((path, cb) => {
      expect(path).toBe(location);
      cb(null, Buffer.from('hello-utf8', 'utf8'));
    });

    const text = await getEncodedFile(sandboxContext, location, 'utf8');
    expect(text).toBe('hello-utf8');
    expect(axios.get).not.toHaveBeenCalled();
  });
});
