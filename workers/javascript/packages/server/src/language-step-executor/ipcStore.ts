import { randomUUID } from 'crypto';
import { Closer, MaybeError } from '@superblocks/shared';
import P from 'pino';
import { IO, KV, KVOps, KVStore, KVStoreTx, Wrapped, WriteOps } from '../types';
import { EgressIpcChannel, IngressIpcChannel, IPC_COMMAND_TYPE } from './ipcTypes';

// Hack to support serializing errors. This is so that we can send errors back to the
// parent process without losing any information.
if (!('toJSON' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      const serializedErr = {
        name: this.name,
        message: this.message,
        stack: this.stack,
        cause: this.cause
      };

      // Add all custom enumerable properties
      Object.keys(this).forEach(function (key) {
        if (!serializedErr[key]) {
          serializedErr[key] = this[key];
        }
      }, this);

      return serializedErr;
    },
    configurable: true,
    writable: true
  });
}

enum Command {
  READ = 'read',
  WRITE = 'write',
  WRITE_MANY = 'write_many',
  DELETE = 'delete',
  DECR = 'decr',
  TX = 'tx'
}

interface kvCommand {
  id: string;
  type: IPC_COMMAND_TYPE;
  command: Command;
  args: Array<unknown>;
}

interface kvResponse {
  id: string;
  type: IPC_COMMAND_TYPE;
  err: MaybeError;
  data: unknown;
}

interface outstandingCommand {
  cmd: kvCommand;
  resp?: kvResponse;
  resolve?: (value: unknown) => void;
}

export class IpcStoreTx implements KVStoreTx {
  public read(key: string): void {
    throw new Error('Method not implemented: transactions/pipelining is not supported for inter-process channel store');
  }

  public write(key: string, value: unknown, ops?: WriteOps): void {
    throw new Error('Method not implemented: transactions/pipelining is not supported for inter-process channel store');
  }

  public commit(ops?: KVOps): Promise<Wrapped<IO, Array<unknown>>> {
    throw new Error('Method not implemented: transactions/pipelining is not supported for inter-process channel store');
  }
}

function RaiseErrorIfShuttingDown(target: IpcStore, name: string, descriptor: PropertyDescriptor) {
  const fn = descriptor.value;
  descriptor.value = async function (...args) {
    if (this._shuttingDown) {
      throw new Error('KV store is shutting down, cannot execute any more new commands');
    }

    return fn.apply(this, args);
  };

  return descriptor;
}

export class IpcStore implements KVStore {
  _outChannel: EgressIpcChannel;
  _inChannel: IngressIpcChannel;
  _outstandingCommands: Map<string, outstandingCommand>;
  _logger: P.BaseLogger;
  _commandResponseHandler: Promise<void>;
  _shuttingDown: boolean;

  constructor(upstreamChannel: EgressIpcChannel, downstreamChannel: IngressIpcChannel, logClient: P.BaseLogger) {
    this._outChannel = upstreamChannel;
    this._inChannel = downstreamChannel;
    this._outstandingCommands = new Map<string, outstandingCommand>();
    this._logger = logClient;
    this._shuttingDown = false;

    // Start the command response handler
    this._commandResponseHandler = this.commandResponseHandler();
  }

  @RaiseErrorIfShuttingDown
  public async read(keys: string[]): Promise<Wrapped<IO, Array<unknown>>> {
    const cmd = { id: randomUUID(), type: IPC_COMMAND_TYPE.KV_COMMAND, command: Command.READ, args: keys };
    const pendingResult = this.waitForCommandResult(cmd);
    this._outChannel.send(cmd);

    const result = await pendingResult;

    return result.data as Wrapped<IO, Array<unknown>>;
  }

  @RaiseErrorIfShuttingDown
  public async write(key: string, value: unknown, ops?: WriteOps): Promise<Wrapped<IO, void>> {
    const cmd = { id: randomUUID(), type: IPC_COMMAND_TYPE.KV_COMMAND, command: Command.WRITE, args: [key, value, ops] };
    const pendingResult = this.waitForCommandResult(cmd);
    this._outChannel.send(cmd);

    const result = await pendingResult;

    return result.data as Wrapped<IO, void>;
  }

  @RaiseErrorIfShuttingDown
  public async writeMany(payload: KV[], ops?: WriteOps): Promise<Wrapped<IO, void>> {
    const cmd = { id: randomUUID(), type: IPC_COMMAND_TYPE.KV_COMMAND, command: Command.WRITE_MANY, args: [payload, ops] };
    const pendingResult = this.waitForCommandResult(cmd);
    this._outChannel.send(cmd);

    const result = await pendingResult;

    return result.data as Wrapped<IO, void>;
  }

  @RaiseErrorIfShuttingDown
  public async delete(keys: string[]): Promise<void> {
    const cmd = { id: randomUUID(), type: IPC_COMMAND_TYPE.KV_COMMAND, command: Command.DELETE, args: keys };
    const pendingResult = this.waitForCommandResult(cmd);
    this._outChannel.send(cmd);

    await pendingResult;
  }

  @RaiseErrorIfShuttingDown
  public async decr(key: string): Promise<number> {
    const cmd = { id: randomUUID(), type: IPC_COMMAND_TYPE.KV_COMMAND, command: Command.DECR, args: [key] };
    const pendingResult = this.waitForCommandResult(cmd);
    this._outChannel.send(cmd);

    const result = await pendingResult;

    return result.data as number;
  }

  @RaiseErrorIfShuttingDown
  public tx(): KVStoreTx {
    return new IpcStoreTx();
  }

  private async commandResponseHandler(): Promise<void> {
    this._inChannel.on('message', (msg: object) => {
      if ('type' in msg && msg.type === IPC_COMMAND_TYPE.KV_RESPONSE) {
        const resp = msg as kvResponse;

        if (this._outstandingCommands.has(resp.id)) {
          this._outstandingCommands.get(resp.id).resp = resp;
          this._outstandingCommands.get(resp.id).resolve('processed');
        }
      }
    });

    while (!this._shuttingDown || this._outstandingCommands.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async waitForCommandResult(cmd: kvCommand): Promise<kvResponse> {
    const pendingCommand: outstandingCommand = { cmd: cmd };
    const cmdPromise = new Promise((resolve) => {
      pendingCommand.resolve = resolve;
    });

    this._outstandingCommands.set(cmd.id, pendingCommand);
    await cmdPromise;

    const result = this._outstandingCommands.get(cmd.id);
    this._outstandingCommands.delete(cmd.id);

    if (result.resp.err) {
      this._logger.error({ cmd: cmd.command, err: result.resp.err }, 'Error executing KV store command');
      throw result.resp.err;
    }

    if ((result.resp.data === null || result.resp.data === undefined) && cmd.command !== Command.DELETE) {
      this._logger.error({ cmd: cmd.command }, 'Error executing KV store command: no response received');
      throw new Error('No response data received from KV store');
    }

    return result.resp;
  }

  public async close(): Promise<MaybeError> {
    this._shuttingDown = true;
    await this._commandResponseHandler;
  }
}

export class IpcStoreExecutor implements Closer {
  _outChannel: EgressIpcChannel;
  _inChannel: IngressIpcChannel;
  _store: KVStore;
  _logger: P.Logger;
  _cmdListener: Promise<void>;
  _shuttingDown: boolean;

  constructor(upstreamChannel: IngressIpcChannel, downstreamChannel: EgressIpcChannel, store: KVStore, logClient: P.Logger) {
    this._outChannel = downstreamChannel;
    this._inChannel = upstreamChannel;
    this._store = store;
    this._logger = logClient;
    this._shuttingDown = false;

    if (store instanceof IpcStore) {
      throw new Error('IpcStoreExecutor cannot be initialized with an IpcStore');
    }

    this._cmdListener = this._startCommandListener();
  }

  static init(
    upstreamChannel: IngressIpcChannel,
    downstreamChannel: EgressIpcChannel,
    store: KVStore,
    logClient: P.Logger
  ): IpcStoreExecutor {
    const logger = logClient.child({ module: 'IpcStoreExecutor' });
    const executor = new IpcStoreExecutor(upstreamChannel, downstreamChannel, store, logger);

    return executor;
  }

  private async _startCommandListener(): Promise<void> {
    this._inChannel.on('message', (msg: object) => {
      (async () => {
        if ('type' in msg && msg.type === IPC_COMMAND_TYPE.KV_COMMAND) {
          if (this._shuttingDown) {
            this._outChannel.send(this._generateShutdownResponse(msg as kvCommand));
          } else {
            const resp: kvResponse = await this._handleCommand(msg as kvCommand);
            this._outChannel.send(resp);
          }
        }
      })();
    });

    while (!this._shuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async _handleCommand(cmd: kvCommand): Promise<kvResponse> {
    const resp: kvResponse = { id: cmd.id, type: IPC_COMMAND_TYPE.KV_RESPONSE, err: undefined, data: undefined };

    try {
      switch (cmd.command) {
        case Command.READ:
          resp.data = await this._store.read(cmd.args as string[]);
          break;
        case Command.WRITE:
          resp.data = await this._store.write(cmd.args[0] as string, cmd.args[1], cmd.args[2] as WriteOps);
          break;
        case Command.WRITE_MANY:
          resp.data = await this._store.writeMany(cmd.args[0] as KV[], cmd.args[1] as WriteOps);
          break;
        case Command.DELETE:
          await this._store.delete(cmd.args as string[]);
          break;
        case Command.DECR:
          resp.data = await this._store.decr(cmd.args[0] as string);
          break;
        case Command.TX:
          this._store.tx();
          break;
        default:
          resp.err = new Error(`Unknown command: ${cmd.command}`);
          break;
      }
    } catch (err) {
      resp.err = err;
    }

    return resp;
  }

  private _generateShutdownResponse(cmd: kvCommand): kvResponse {
    return {
      id: cmd.id,
      type: IPC_COMMAND_TYPE.KV_RESPONSE,
      err: new Error('IPC store is shutting down: cannot process any new requests'),
      data: undefined
    } as kvResponse;
  }

  public async close(reason?: string): Promise<MaybeError> {
    this._logger.info({ reason }, 'Shutting down IPC store executor...');
    this._shuttingDown = true;

    await this._cmdListener;

    this._logger.info({ reason }, 'Successfully shutdown IPC store executor');
  }
}
