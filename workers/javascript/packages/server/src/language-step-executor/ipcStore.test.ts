import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import P from 'pino';
import { MockKVStore } from '../store/mock';
import { MockEgressIpcChannel, MockIngressIpcChannel } from './ipcMocks';
import { IpcStore, IpcStoreExecutor } from './ipcStore';

const mockLogger: P.Logger = P({ level: 'silent' });

describe('IpcStore', () => {
  let mockEgressChannel: MockEgressIpcChannel;
  let mockIngressChannel: MockIngressIpcChannel;
  let ipcStore: IpcStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEgressChannel = new MockEgressIpcChannel();
    mockIngressChannel = new MockIngressIpcChannel();
    ipcStore = new IpcStore(mockEgressChannel, mockIngressChannel, mockLogger);
  });

  afterEach(async () => {
    await ipcStore.close();
  });

  describe('read', () => {
    it('sends a read command to the parent process and awaits result', async () => {
      const read1 = ipcStore.read(['test.var.key1', 'test.var.key2']);
      const read2 = ipcStore.read(['test.var.key3', 'test.var.key4']);

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'read',
          args: ['test.var.key1', 'test.var.key2']
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'read',
          args: ['test.var.key3', 'test.var.key4']
        }
      ]);

      mockIngressChannel.emit('message', {
        id: egressCmds[1].id,
        type: 'kv_response',
        err: null,
        data: [{ value: 'val3' }, { value: 'val4' }]
      });
      mockIngressChannel.emit('message', {
        id: egressCmds[0].id,
        type: 'kv_response',
        err: null,
        data: [{ value: 'val1' }, { value: 'val2' }]
      });

      await expect(read1).resolves.toEqual([{ value: 'val1' }, { value: 'val2' }]);
      await expect(read2).resolves.toEqual([{ value: 'val3' }, { value: 'val4' }]);
    });

    it('raises error when response data is empty', async () => {
      const read = ipcStore.read(['test.var.key']);

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', { id: mockEgressChannel.sentData[0].id, type: 'kv_response', err: null, data: null });

      await expect(read).rejects.toThrowError('No response data received from KV store');
    });

    it('raises error when response contains error', async () => {
      const read = ipcStore.read(['test.var.key']);

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', {
        id: mockEgressChannel.sentData[0].id,
        type: 'kv_response',
        err: new Error('KV store error: key not found'),
        data: {}
      });

      await expect(read).rejects.toThrowError('KV store error: key not found');
    });
  });

  describe('write', () => {
    it('sends a write command to the parent process and awaits result', async () => {
      const write1 = ipcStore.write('test.var.key1', { value: 'val1' }, { maxSize: 1024 });
      const write2 = ipcStore.write('test.var.key2', { value: 'val2' });

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'write',
          args: ['test.var.key1', { value: 'val1' }, { maxSize: 1024 }]
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'write',
          args: ['test.var.key2', { value: 'val2' }]
        }
      ]);

      mockIngressChannel.emit('message', { id: egressCmds[1].id, type: 'kv_response', err: null, data: { data: undefined as void } });
      mockIngressChannel.emit('message', { id: egressCmds[0].id, type: 'kv_response', err: null, data: { data: undefined as void } });

      await expect(write1).resolves.toEqual({ data: undefined as void });
      await expect(write2).resolves.toEqual({ data: undefined as void });
    });

    it('raises error when response data is empty', async () => {
      const write = ipcStore.write('test.var.key', { value: 'val' });

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', { id: mockEgressChannel.sentData[0].id, type: 'kv_response', err: null, data: null });

      await expect(write).rejects.toThrowError('No response data received from KV store');
    });

    it('raises error when response contains error', async () => {
      const write = ipcStore.write('test.var.key', { value: 'val' });

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', {
        id: mockEgressChannel.sentData[0].id,
        type: 'kv_response',
        err: new Error('KV store error: quota exceeded'),
        data: {}
      });

      await expect(write).rejects.toThrowError('KV store error: quota exceeded');
    });
  });

  describe('writeMany', () => {
    it('sends a writeMany command to the parent process and awaits result', async () => {
      const write1 = ipcStore.writeMany([
        { key: 'test.var.key1', value: { set: true } },
        { key: 'test.var.key2', value: { set: false } }
      ]);
      const write2 = ipcStore.writeMany(
        [
          { key: 'test.var.key3', value: { set: false } },
          { key: 'test.var.key4', value: { set: true } }
        ],
        { maxSize: 512 }
      );

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'write_many',
          args: [
            [
              { key: 'test.var.key1', value: { set: true } },
              { key: 'test.var.key2', value: { set: false } }
            ]
          ]
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'write_many',
          args: [
            [
              { key: 'test.var.key3', value: { set: false } },
              { key: 'test.var.key4', value: { set: true } }
            ],
            { maxSize: 512 }
          ]
        }
      ]);

      mockIngressChannel.emit('message', { id: egressCmds[1].id, type: 'kv_response', err: null, data: { data: undefined as void } });
      mockIngressChannel.emit('message', { id: egressCmds[0].id, type: 'kv_response', err: null, data: { data: undefined as void } });

      await expect(write1).resolves.toEqual({ data: undefined as void });
      await expect(write2).resolves.toEqual({ data: undefined as void });
    });

    it('raises error when response data is empty', async () => {
      const write = ipcStore.writeMany([{ key: 'test.var.key', value: { set: true } }]);

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', { id: mockEgressChannel.sentData[0].id, type: 'kv_response', err: null, data: null });

      await expect(write).rejects.toThrowError('No response data received from KV store');
    });

    it('raises error when response contains error', async () => {
      const write = ipcStore.writeMany([{ key: 'test.var.key', value: { set: true } }]);

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', {
        id: mockEgressChannel.sentData[0].id,
        type: 'kv_response',
        err: new Error('KV store error: connection interrupted'),
        data: {}
      });

      await expect(write).rejects.toThrowError('KV store error: connection interrupted');
    });
  });

  describe('delete', () => {
    it('sends a delete command to the parent process and awaits empty response', async () => {
      const delete1 = ipcStore.delete(['test.var.key1', 'test.var.key2']);
      const delete2 = ipcStore.delete(['test.var.key3']);

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'delete',
          args: ['test.var.key1', 'test.var.key2']
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'delete',
          args: ['test.var.key3']
        }
      ]);

      mockIngressChannel.emit('message', { id: egressCmds[1].id, type: 'kv_response', err: null, data: null });
      mockIngressChannel.emit('message', { id: egressCmds[0].id, type: 'kv_response', err: null, data: undefined });

      expect(delete1).resolves;
      expect(delete2).resolves;
    });

    it('raises error when response contains error', async () => {
      const delete1 = ipcStore.delete(['test.var.key']);

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', {
        id: mockEgressChannel.sentData[0].id,
        type: 'kv_response',
        err: new Error('KV store error: key does not exist'),
        data: null
      });

      await expect(delete1).rejects.toThrowError('KV store error: key does not exist');
    });
  });

  describe('decr', () => {
    it('sends a decr command to the parent process and awaits result', async () => {
      const decr1 = ipcStore.decr('test.var.key1');
      const decr2 = ipcStore.decr('test.var.key2');

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'decr',
          args: ['test.var.key1']
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'decr',
          args: ['test.var.key2']
        }
      ]);

      mockIngressChannel.emit('message', { id: egressCmds[1].id, type: 'kv_response', err: null, data: 0 });
      mockIngressChannel.emit('message', { id: egressCmds[0].id, type: 'kv_response', err: null, data: 15 });

      await expect(decr1).resolves.toEqual(15);
      await expect(decr2).resolves.toEqual(0);
    });

    it('raises error when response data is empty', async () => {
      const decr = ipcStore.decr('test.var.key');

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', { id: mockEgressChannel.sentData[0].id, type: 'kv_response', err: null, data: null });

      await expect(decr).rejects.toThrowError('No response data received from KV store');
    });

    it('raises error when response contains error', async () => {
      const decr = ipcStore.decr('test.var.key');

      expect(mockEgressChannel.sentData.length).toEqual(1);
      mockIngressChannel.emit('message', {
        id: mockEgressChannel.sentData[0].id,
        type: 'kv_response',
        err: new Error('KV store error: integer underflow error'),
        data: {}
      });

      await expect(decr).rejects.toThrowError('KV store error: integer underflow error');
    });
  });

  describe('close', () => {
    it('waits for outstanding requests to complete before returning', async () => {
      const mockEgressChannel = new MockEgressIpcChannel();
      const mockIngressChannel = new MockIngressIpcChannel();

      const ipcStore = new IpcStore(mockEgressChannel, mockIngressChannel, mockLogger);

      const read1 = ipcStore.read(['test.var.key1', 'test.var.key2']);
      const read2 = ipcStore.read(['test.var.key3', 'test.var.key4']);

      const closePromise = ipcStore.close();

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds.length).toEqual(2);

      mockIngressChannel.emit('message', {
        id: egressCmds[0].id,
        type: 'kv_response',
        err: null,
        data: [{ value: 'val1' }, { value: 'val2' }]
      });
      mockIngressChannel.emit('message', {
        id: egressCmds[1].id,
        type: 'kv_response',
        err: null,
        data: [{ value: 'val3' }, { value: 'val4' }]
      });

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'read',
          args: ['test.var.key1', 'test.var.key2']
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'read',
          args: ['test.var.key3', 'test.var.key4']
        }
      ]);

      await expect(closePromise).resolves.toBeUndefined();
      await expect(read1).resolves.toEqual([{ value: 'val1' }, { value: 'val2' }]);
      await expect(read2).resolves.toEqual([{ value: 'val3' }, { value: 'val4' }]);
    });

    it('all commands are rejected after close is called', async () => {
      const mockEgressChannel = new MockEgressIpcChannel();
      const mockIngressChannel = new MockIngressIpcChannel();

      const ipcStore = new IpcStore(mockEgressChannel, mockIngressChannel, mockLogger);

      const closePromise = ipcStore.close();

      // Attempt all commands after closing store
      await expect(ipcStore.read(['test.read.key'])).rejects.toThrowError(
        'KV store is shutting down, cannot execute any more new commands'
      );
      await expect(ipcStore.write('test.write.key', 'value')).rejects.toThrowError(
        'KV store is shutting down, cannot execute any more new commands'
      );
      await expect(ipcStore.writeMany([{ key: 'test.writeMany.key', value: 'value' }])).rejects.toThrowError(
        'KV store is shutting down, cannot execute any more new commands'
      );
      await expect(ipcStore.delete(['test.delete.key'])).rejects.toThrowError(
        'KV store is shutting down, cannot execute any more new commands'
      );
      await expect(ipcStore.decr('test.decr.key')).rejects.toThrowError('KV store is shutting down, cannot execute any more new commands');

      // Assert no requests were sent to the parent process
      expect(mockEgressChannel.sentData.length).toEqual(0);

      await expect(closePromise).resolves.toBeUndefined();
    });
  });

  describe('command response handler', () => {
    it('ignores non-KV response type messages and unrecognized cmd IDs', async () => {
      // Send first request
      const read = ipcStore.read(['test.var.key1']);

      // Send non-KV response type messages
      mockIngressChannel.emit('message', { id: '123', type: 'not_kv_response', err: null, data: null });
      mockIngressChannel.emit('message', { id: '321', err: null, data: null }); // Message with missing type field
      mockIngressChannel.emit('message', { id: 'non-existent-id', type: 'kv_response', err: null, data: null });

      // Send second request
      const decr = ipcStore.decr('test.var.key2');

      // Complete outstanding requests
      const egressCmds = mockEgressChannel.sentData;
      expect(egressCmds).toEqual([
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'read',
          args: ['test.var.key1']
        },
        {
          id: expect.any(String),
          type: 'kv_command',
          command: 'decr',
          args: ['test.var.key2']
        }
      ]);

      mockIngressChannel.emit('message', { id: egressCmds[0].id, type: 'kv_response', err: null, data: [{ value: 'val1' }] });
      mockIngressChannel.emit('message', { id: egressCmds[1].id, type: 'kv_response', err: null, data: 6 });

      await expect(read).resolves.toEqual([{ value: 'val1' }]);
      await expect(decr).resolves.toEqual(6);
    });
  });
});

describe('IpcStoreExecutor', () => {
  let mockIngressChannel: MockIngressIpcChannel;
  let mockEgressChannel: MockEgressIpcChannel;
  let mockBackingStore: MockKVStore;
  let ipcExecutor: IpcStoreExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIngressChannel = new MockIngressIpcChannel();
    mockEgressChannel = new MockEgressIpcChannel();
    mockBackingStore = new MockKVStore();
    ipcExecutor = new IpcStoreExecutor(mockIngressChannel, mockEgressChannel, mockBackingStore, mockLogger);
  });

  afterEach(async () => {
    await ipcExecutor.close();
  });

  describe('commands', () => {
    beforeEach(async () => {
      await mockBackingStore.write('test.var.key1', { value: 'val1' });
      await mockBackingStore.write('test.var.key2', { value: 'val2' });
      await mockBackingStore.write('test.var.key3', 1);
      await mockBackingStore.write('test.var.key4', 11);
    });

    it('read', async () => {
      mockIngressChannel.emit('message', { id: 'test-id-1', type: 'kv_command', command: 'read', args: ['test.var.key1'] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-1',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: [{ value: 'val1' }] }
        }
      ]);
    });

    it('write', async () => {
      mockIngressChannel.emit('message', {
        id: 'test-id-2',
        type: 'kv_command',
        command: 'write',
        args: ['test.var.key1', { value: 'newVal' }]
      });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Read result back
      mockIngressChannel.emit('message', { id: 'test-id-3', type: 'kv_command', command: 'read', args: ['test.var.key1'] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-2',
          type: 'kv_response',
          err: undefined,
          data: { data: undefined }
        },
        {
          id: 'test-id-3',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: [{ value: 'newVal' }] }
        }
      ]);
    });

    it('writeMany', async () => {
      mockIngressChannel.emit('message', {
        id: 'test-id-4',
        type: 'kv_command',
        command: 'write_many',
        args: [
          [
            { key: 'test.var.key1', value: { set: true } },
            { key: 'test.var.new_key', value: { set: false } }
          ]
        ]
      });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Read result back
      mockIngressChannel.emit('message', {
        id: 'test-id-5',
        type: 'kv_command',
        command: 'read',
        args: ['test.var.key1', 'test.var.new_key']
      });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-4',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: undefined }
        },
        {
          id: 'test-id-5',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: [{ set: true }, { set: false }] }
        }
      ]);
    });

    it('delete', async () => {
      mockIngressChannel.emit('message', { id: 'test-id-6', type: 'kv_command', command: 'delete', args: [['test.var.key1']] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Read result back
      mockIngressChannel.emit('message', { id: 'test-id-7', type: 'kv_command', command: 'read', args: ['test.var.key1'] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-6',
          type: 'kv_response',
          err: undefined,
          data: undefined
        },
        {
          id: 'test-id-7',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: [undefined] }
        }
      ]);
    });

    it('decr', async () => {
      mockIngressChannel.emit('message', { id: 'test-id-8', type: 'kv_command', command: 'decr', args: ['test.var.key3'] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-8',
          type: 'kv_response',
          err: undefined,
          data: 0
        }
      ]);
    });
  });

  describe('close', () => {
    it('returns error for all incoming commands after close is called', async () => {
      mockIngressChannel.emit('message', { id: 'test-id-1', type: 'kv_command', command: 'read', args: ['test.var.key1'] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-1',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: [] }
        }
      ]);

      const closePromise = ipcExecutor.close();

      // Attempt a command after closing store
      mockIngressChannel.emit('message', { id: 'test-id-2', type: 'kv_command', command: 'read', args: ['test.var.key2'] });

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData).toEqual([
        {
          id: 'test-id-1',
          type: 'kv_response',
          err: undefined,
          data: { pinned: { read: 0, write: 0 }, data: [] }
        },
        {
          id: 'test-id-2',
          type: 'kv_response',
          err: new Error('IPC store is shutting down: cannot process any new requests'),
          data: undefined
        }
      ]);

      await expect(closePromise).resolves.toBeUndefined();
    });
  });

  describe('command listener', () => {
    it('ignores all non-KV command type messages', async () => {
      mockIngressChannel.emit('message', { id: 'test-id-1', type: 'not_kv_command', command: 'read', args: ['test.var.key1'] });
      mockIngressChannel.emit('message', { id: 'test-id-1', command: 'read', args: ['test.var.key1'] }); // message missing type field

      // Wait for mockEgressChannel to receive response from IPC store executor
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockEgressChannel.sentData.length).toEqual(0);
    });
  });
});
