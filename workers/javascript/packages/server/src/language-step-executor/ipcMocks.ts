import { EgressIpcChannel, IngressIpcChannel } from './ipcTypes';

export class MockEgressIpcChannel implements EgressIpcChannel {
  private _sentData: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

  public send(
    message: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    sendHandle?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: { swallowErrors?: boolean | undefined },
    callback?: (error: Error | null) => void
  ): boolean {
    this._sentData.push(message);
    if (callback) {
      callback(null);
    }
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get sentData(): any[] {
    return this._sentData;
  }
}

export class MockIngressIpcChannel implements IngressIpcChannel {
  private _listeners: Record<string, NodeJS.MessageListener[]> = {};

  public on(event: 'message', listener: NodeJS.MessageListener): IngressIpcChannel {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emit(event: 'message', ...args: any[]): boolean {
    if (this._listeners[event]) {
      this._listeners[event].forEach((listener) => listener(args[0], args[1]));
      return true;
    }

    return false;
  }
}
