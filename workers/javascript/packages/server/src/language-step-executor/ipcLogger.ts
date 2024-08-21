import { Closer, MaybeError } from '@superblocks/shared';
import P from 'pino';
import { EgressIpcChannel, IngressIpcChannel, IPC_COMMAND_TYPE } from './ipcTypes';

interface logCommand {
  type: IPC_COMMAND_TYPE;
  level: P.LevelWithSilent;
  message: string;
  kvData: Record<string, unknown>;
  extraArgs: Array<unknown>;
}

export class IpcLogger implements P.BaseLogger, Closer {
  private _outChannel: EgressIpcChannel;
  private _bindings: P.Bindings;
  private _shuttingDown: boolean;

  public level: P.LevelWithSilent;

  constructor(egressChannel: EgressIpcChannel, level: P.LevelWithSilent = 'info') {
    this._outChannel = egressChannel;
    this._bindings = {};
    this._shuttingDown = false;
    this.level = level;
  }

  public child(bindings: P.Bindings): IpcLogger {
    this._bindings = { ...this._bindings, ...bindings };
    return this;
  }

  public fatal(msg: string, ...args: unknown[]): void;
  public fatal(obj: unknown, msg?: string, ...args: unknown[]): void;
  public fatal<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('fatal', msg, obj, args);
  }

  public error(msg: string, ...args: unknown[]): void;
  public error(obj: unknown, msg?: string, ...args: unknown[]): void;
  public error<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('error', msg, obj, args);
  }

  public warn(msg: string, ...args: unknown[]): void;
  public warn(obj: unknown, msg?: string, ...args: unknown[]): void;
  public warn<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('warn', msg, obj, args);
  }

  public info(msg: string, ...args: unknown[]): void;
  public info(obj: unknown, msg?: string, ...args: unknown[]): void;
  public info<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('info', msg, obj, args);
  }

  public debug(msg: string, ...args: unknown[]): void;
  public debug(obj: unknown, msg?: string, ...args: unknown[]): void;
  public debug<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('debug', msg, obj, args);
  }

  public trace(msg: string, ...args: unknown[]): void;
  public trace(obj: unknown, msg?: string, ...args: unknown[]): void;
  public trace<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('trace', msg, obj, args);
  }

  public silent(msg: string, ...args: unknown[]): void;
  public silent(obj: unknown, msg?: string, ...args: unknown[]): void;
  public silent<T extends object>(obj: T, msg?: string, ...args: unknown[]): void {
    this._sendLog('silent', msg, obj, args);
  }

  private _sendLog(level: P.LevelWithSilent, message: string, obj: object, args: unknown[]): void {
    if (!this._shuttingDown && typeof this._outChannel.send === 'function') {
      const [msg, kvData, extraArgs] = this._parseLogArgs(obj, message, ...args);

      this._outChannel.send({
        type: IPC_COMMAND_TYPE.LOG_REQUEST,
        level: level,
        message: msg,
        kvData: { ...this._bindings, ...kvData },
        extraArgs: extraArgs
      });
    }
  }

  private _parseLogArgs(obj: unknown, msg?: string, ...args: unknown[]): [string, object, unknown[]] {
    let message: string;
    let extraArgs: unknown[];
    let kvData: object;

    if (typeof obj === 'string') {
      message = obj;
      extraArgs = [msg, ...args];
      kvData = {};
    } else {
      kvData = obj as object;
      if (typeof msg === 'string') {
        message = msg;
        extraArgs = args;
      } else {
        message = '';
        extraArgs = [msg, ...args];
      }
    }

    return [message, kvData, extraArgs];
  }

  public async close(reason?: string): Promise<MaybeError> {
    this._shuttingDown = true;
  }
}

export class IpcLogCommitter implements Closer {
  private _inChannel: IngressIpcChannel;
  private _logger: P.BaseLogger;
  private _logFuncMap: Record<P.LevelWithSilent, P.LogFn>;
  private _logListener: Promise<void>;
  private _shuttingDown: boolean;

  constructor(logClient: P.BaseLogger, ingressChannel: IngressIpcChannel) {
    this._logger = logClient;
    this._inChannel = ingressChannel;
    this._shuttingDown = false;

    this._updateLogFuncMap(logClient);
    this._logListener = this._startLogListener();
  }

  public attachLogger(logClient: P.BaseLogger): void {
    this._logger = logClient;
    this._updateLogFuncMap(logClient);
  }

  private _updateLogFuncMap(logClient: P.BaseLogger): void {
    this._logFuncMap = {
      fatal: logClient.fatal.bind(logClient),
      error: logClient.error.bind(logClient),
      warn: logClient.warn.bind(logClient),
      info: logClient.info.bind(logClient),
      debug: logClient.debug.bind(logClient),
      trace: logClient.trace.bind(logClient),
      silent: logClient.silent.bind(logClient)
    };
  }

  private async _startLogListener(): Promise<void> {
    this._inChannel.on('message', (msg: object) => {
      (() => {
        if (typeof msg === 'object' && 'type' in msg && msg.type === IPC_COMMAND_TYPE.LOG_REQUEST) {
          if (!this._shuttingDown) {
            this._handleCommand(msg as logCommand);
          }
        }
      })();
    });
  }

  private _handleCommand(cmd: logCommand): void {
    if (cmd.level in this._logFuncMap) {
      this._logFuncMap[cmd.level]({ ...cmd.kvData }, cmd.message, ...cmd.extraArgs);
    } else {
      this._logger.warn({ logLevel: cmd.level }, 'IPC log attempt with invalid log level');
    }
  }

  public async close(reason?: string): Promise<MaybeError> {
    this._logger.debug({ reason }, 'Shutting down IPC logger...');
    this._shuttingDown = true;

    await this._logListener;

    this._logger.debug({ reason }, 'Successfully shutdown IPC logger');
  }
}
