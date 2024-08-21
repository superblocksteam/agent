import { Serializable } from 'child_process';

export class MockSubProcess {
  private _sentData: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
  private _listeners: Record<string, NodeJS.MessageListener[]> = {};
  private _connected = true;
  private _exitCode?: number = null;
  private _signal?: string = null;
  private _pid: number;

  public constructor(pid?: number) {
    this._pid = pid ?? 54321;
  }

  public get pid(): number {
    return this._pid;
  }

  public get connected(): boolean {
    return this._connected;
  }

  public get exitCode(): number | null {
    return this._exitCode;
  }

  public get signal(): string | null {
    return this._signal;
  }

  public get stdout(): unknown {
    return this;
  }

  public get stderr(): unknown {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emit(event: string, ...args: any[]): boolean {
    if (this._listeners[event]) {
      this._listeners[event].forEach((listener) => listener(args[0], args[1]));
      return true;
    }

    return false;
  }

  public on(event: string, listener: NodeJS.MessageListener): MockSubProcess {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
    return this;
  }

  public once(event: string, listener: NodeJS.MessageListener): MockSubProcess {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
    return this;
  }

  public send(message: Serializable, callback?: (error: Error | null) => void): boolean {
    this._sentData.push(message);
    if (callback) {
      callback(null);
    }
    return true;
  }

  public removeAllListeners(): void {
    this._listeners = {};
  }

  public disconnect(): void {
    this._connected = false;
  }

  public unref(): void {
    return;
  }

  public kill(code?: number, signal?: string): boolean {
    if (code === 0 && (signal === undefined || signal === null)) {
      if (!this._connected && (this._exitCode !== null || this._signal !== null)) {
        throw new Error('Process already exited');
      }

      return false;
    }

    this._connected = false;
    this._exitCode = code ?? -2;
    this._signal = signal ?? 'SIGTERM';
    this.emit('exit', this._exitCode, this._signal);

    if (this._exitCode !== 0) {
      this.emit('error', new Error(`Process exited with non-zero exit code: ${this._exitCode}`));
    }

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public sentData(): any[] {
    return this._sentData;
  }

  public clearSentData(): void {
    this._sentData = [];
  }
}
