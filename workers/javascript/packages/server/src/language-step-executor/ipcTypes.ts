export interface EgressIpcChannel {
  send?(
    message: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    sendHandle?: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    options?: {
      swallowErrors?: boolean | undefined;
    },
    callback?: (error: Error | null) => void
  ): boolean;
}

export interface IngressIpcChannel {
  on(event: 'message', listener: NodeJS.MessageListener): IngressIpcChannel;
}

export enum IPC_COMMAND_TYPE {
  KV_COMMAND = 'kv_command',
  KV_RESPONSE = 'kv_response',
  LOG_REQUEST = 'log_request'
}
