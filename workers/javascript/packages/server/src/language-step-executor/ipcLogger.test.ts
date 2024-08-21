import { describe } from '@jest/globals';
import { IpcLogCommitter, IpcLogger } from './ipcLogger';
import { MockEgressIpcChannel, MockIngressIpcChannel } from './ipcMocks';
import { IPC_COMMAND_TYPE } from './ipcTypes';

describe('IpcLogger', () => {
  let mockEgressChannel: MockEgressIpcChannel;
  let ipcLogger: IpcLogger;

  beforeEach(() => {
    mockEgressChannel = new MockEgressIpcChannel();
    ipcLogger = new IpcLogger(mockEgressChannel);
  });

  afterEach(async () => {
    await ipcLogger.close();
  });

  describe('child', () => {
    it.each([
      { level: 'fatal' },
      { level: 'error' },
      { level: 'warn' },
      { level: 'info' },
      { level: 'debug' },
      { level: 'trace' },
      { level: 'silent' }
    ])('includes all bindings in $level log', ({ level }) => {
      const logger = ipcLogger.child({ foo: 'bar' });
      expect(logger).toBeInstanceOf(IpcLogger);

      const child = logger.child({ baz: 'qux' });
      expect(child).toBeInstanceOf(IpcLogger);

      child[level]('log message');
      child[level]({ kv: 'args' }, 'log message');
      child[level]({ kv: 'args', foo: 'baz' }, 'log message');

      const logRequests = mockEgressChannel.sentData;
      expect(logRequests).toEqual([
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'log message',
          kvData: { foo: 'bar', baz: 'qux' },
          extraArgs: []
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'log message',
          kvData: { kv: 'args', foo: 'bar', baz: 'qux' },
          extraArgs: []
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'log message',
          kvData: { kv: 'args', foo: 'baz', baz: 'qux' },
          extraArgs: []
        }
      ]);
    });
  });

  describe('sendLog', () => {
    it.each([
      { level: 'fatal' },
      { level: 'error' },
      { level: 'warn' },
      { level: 'info' },
      { level: 'debug' },
      { level: 'trace' },
      { level: 'silent' }
    ])('should send a $level log message', ({ level }) => {
      ipcLogger[level]('foo');
      ipcLogger[level]('foo', { any: 'args' }, 'more args');
      ipcLogger[level]({ kv: 'args' }, 'foo');
      ipcLogger[level]({ kv: 'args' });
      ipcLogger[level]({ kv: 'args' }, { any: 'args' }, 'more args');
      ipcLogger[level]({ kv: 'args' }, 'foo', { any: 'args' }, 'more args');

      const logRequests = mockEgressChannel.sentData;
      expect(logRequests).toEqual([
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'foo',
          kvData: {},
          extraArgs: []
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'foo',
          kvData: {},
          extraArgs: [{ any: 'args' }, 'more args']
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'foo',
          kvData: { kv: 'args' },
          extraArgs: []
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: '',
          kvData: { kv: 'args' },
          extraArgs: []
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: '',
          kvData: { kv: 'args' },
          extraArgs: [{ any: 'args' }, 'more args']
        },
        {
          type: IPC_COMMAND_TYPE.LOG_REQUEST,
          level,
          message: 'foo',
          kvData: { kv: 'args' },
          extraArgs: [{ any: 'args' }, 'more args']
        }
      ]);
    });

    it.each([
      { level: 'fatal' },
      { level: 'error' },
      { level: 'warn' },
      { level: 'info' },
      { level: 'debug' },
      { level: 'trace' },
      { level: 'silent' }
    ])('should not send any $level logs when out channel does not have a send method', ({ level }) => {
      const noSendEgressChannel = new MockEgressIpcChannel();
      noSendEgressChannel.send = undefined;

      const noSendLogger = new IpcLogger(noSendEgressChannel);

      noSendLogger[level]('foo');

      expect(noSendEgressChannel.sentData).toHaveLength(0);
    });
  });

  describe('close', () => {
    it.each([
      { level: 'fatal' },
      { level: 'error' },
      { level: 'warn' },
      { level: 'info' },
      { level: 'debug' },
      { level: 'trace' },
      { level: 'silent' }
    ])('should not send any $level logs when IPC logger is closed', async ({ level }) => {
      await ipcLogger.close();

      ipcLogger[level]('foo');

      expect(mockEgressChannel.sentData).toHaveLength(0);
    });
  });
});

describe('IpcLogCommitter', () => {
  let mockIngressChannel: MockIngressIpcChannel;
  const mockLogger = {
    level: 'info',
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    silent: jest.fn()
  };
  let logCommitter: IpcLogCommitter;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIngressChannel = new MockIngressIpcChannel();
    logCommitter = new IpcLogCommitter(mockLogger, mockIngressChannel);
  });

  afterEach(async () => {
    await logCommitter.close();
  });

  describe('handleCommand', () => {
    it.each([
      { level: 'fatal' },
      { level: 'error' },
      { level: 'warn' },
      { level: 'info' },
      { level: 'debug' },
      { level: 'trace' },
      { level: 'silent' }
    ])('should write a $level log when a log request is received', ({ level }) => {
      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level,
        message: 'foo',
        kvData: {},
        extraArgs: []
      });

      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level,
        message: 'foo',
        kvData: { kv: 'args' },
        extraArgs: []
      });

      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level,
        message: 'foo',
        kvData: { kv: 'args' },
        extraArgs: [{ any: 'args' }, 'more args']
      });

      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level,
        message: '',
        kvData: { kv: 'args' },
        extraArgs: [{ any: 'args' }, 'more args']
      });

      expect(mockLogger[level].mock.calls).toEqual([
        [{}, 'foo', ...[]],
        [{ kv: 'args' }, 'foo', ...[]],
        [{ kv: 'args' }, 'foo', { any: 'args' }, 'more args'],
        [{ kv: 'args' }, '', { any: 'args' }, 'more args']
      ]);
    });

    it('should not write a log when message received is not a valid log command', () => {
      mockIngressChannel.emit('message', 'ready');
      mockIngressChannel.emit('message', {
        level: 'info',
        message: 'foo',
        kvData: { kv: 'args' },
        extraArgs: []
      });
      mockIngressChannel.emit('message', {
        type: 'not a log request',
        level: 'info',
        message: 'foo',
        kvData: { kv: 'args' },
        extraArgs: []
      });

      expect(mockLogger.fatal).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.trace).not.toHaveBeenCalled();
      expect(mockLogger.silent).not.toHaveBeenCalled();
    });

    it('should not write a log when a log request with an invalid level is received', () => {
      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: 'invalid',
        message: 'foo',
        kvData: {},
        extraArgs: []
      });

      expect(mockLogger.warn.mock.calls).toEqual([[{ logLevel: 'invalid' }, 'IPC log attempt with invalid log level']]);
      expect(mockLogger.fatal).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.trace).not.toHaveBeenCalled();
      expect(mockLogger.silent).not.toHaveBeenCalled();
    });
  });

  describe('attachLogger', () => {
    it.each([
      { level: 'fatal' },
      { level: 'error' },
      { level: 'warn' },
      { level: 'info' },
      { level: 'debug' },
      { level: 'trace' },
      { level: 'silent' }
    ])('should attach and send logs to new logger', ({ level }) => {
      const newMockLogger = {
        level: 'info',
        fatal: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        silent: jest.fn()
      };

      logCommitter.attachLogger(newMockLogger);

      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: level,
        message: 'foo',
        kvData: {},
        extraArgs: []
      });

      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: level,
        message: 'foo',
        kvData: {},
        extraArgs: [{ any: 'args' }, 'more args']
      });

      mockIngressChannel.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: level,
        message: 'foo',
        kvData: { kv: 'args' },
        extraArgs: []
      });

      expect(newMockLogger[level].mock.calls).toEqual([
        [{}, 'foo'],
        [{}, 'foo', { any: 'args' }, 'more args'],
        [{ kv: 'args' }, 'foo']
      ]);

      expect(mockLogger.fatal).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.trace).not.toHaveBeenCalled();
      expect(mockLogger.silent).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should stop listening for messages after IPC log committer is closed', async () => {
      const mockIngress = new MockIngressIpcChannel();
      const logWriter = new IpcLogCommitter(mockLogger, mockIngress);
      await logWriter.close('test reason');

      mockIngress.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: 'info',
        message: 'foo',
        kvData: {},
        extraArgs: []
      });

      mockIngress.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: 'debug',
        message: 'foo',
        kvData: {},
        extraArgs: [{ any: 'args' }, 'more args']
      });

      mockIngress.emit('message', {
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: 'error',
        message: 'foo',
        kvData: { kv: 'args' },
        extraArgs: []
      });

      expect(mockLogger.debug.mock.calls).toEqual([
        [{ reason: 'test reason' }, 'Shutting down IPC logger...'],
        [{ reason: 'test reason' }, 'Successfully shutdown IPC logger']
      ]);
      expect(mockLogger.fatal).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.trace).not.toHaveBeenCalled();
      expect(mockLogger.silent).not.toHaveBeenCalled();
    });
  });
});
