import { ActionConfiguration, ExecutionContext, MaybeError } from '@superblocks/shared';
import { PluginProps } from '../plugin-property/plugin-props';
import { PoolExecResult } from '../types';
import { IpcLogger } from './ipcLogger';
import { IpcStore } from './ipcStore';
import { ExecutionOutput } from './native-plugin/executionOutput';
import { NativeJavascriptPlugin } from './native-plugin/nativeJavascriptPlugin';

// @ts-ignore
let _logger = new IpcLogger(process).child({ who: 'pool_plugin_executor' });

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

const timedPluginExecute = async (
  plugin: NativeJavascriptPlugin,
  context: ExecutionContext,
  actionConfiguration: ActionConfiguration,
  filePaths?: Record<string, string>,
  inheritedEnv?: Array<string>
): Promise<ExecutionOutput> => {
  const output = new ExecutionOutput();
  output.startTimeUtc = new Date();

  try {
    const innerOutput = await plugin.execute({
      context: context,
      actionConfiguration: actionConfiguration,
      filePaths: filePaths,
      inheritedEnv: inheritedEnv
    });

    output.error = innerOutput.error;
    output.log = output.log.concat(innerOutput.log);
    output.structuredLog = output.structuredLog.concat(innerOutput.structuredLog);
    output.output = innerOutput.output;
  } catch (err) {
    _logger.info(`Executing API step javascript failed with error: ${err.message}`);
    output.logError(err.message);
  } finally {
    output.executionTime = Date.now() - output.startTimeUtc.getTime();
  }

  _logger.info(`Executing API step javascript took ${output.executionTime}ms`);
  return output;
};

const processSend = (message: unknown): void => {
  // Only send message if the process is a child process created with an IPC channel
  if (typeof process.send === 'function') {
    process.send(message);
  }
};

export const pluginExecutor = async (): Promise<void> => {
  _logger.debug('Initializing new pool process: preparing for plugin execution');

  // @ts-ignore
  const kvStore = new IpcStore(process, process, _logger);
  const plugin = new NativeJavascriptPlugin();

  _logger.debug('Pool process ready for plugin execution');
  processSend('ready');

  let poolId: number;
  let props: PluginProps;
  let filePaths: Record<string, string>;
  let inheritedEnv: Array<string>;

  await new Promise((resolve) => {
    process.once('message', (data) => {
      if (data['type'] === 'plugin_exec_request') {
        poolId = data['poolId'];
        props = data['pluginProps'] as PluginProps;
        filePaths = data['filePaths'] as Record<string, string>;
        inheritedEnv = data['inheritedEnv'] as Array<string>;
        resolve(data);
      }
    });
  });

  _logger = _logger.child({ poolId: poolId });
  _logger.debug('Received request to execute plugin');

  let output: ExecutionOutput;
  let execErr: Error = undefined;
  let closeStoreProm: Promise<MaybeError> = undefined;

  try {
    props.context.kvStore = kvStore;
    output = await timedPluginExecute(plugin, props.context, props.actionConfiguration, filePaths, inheritedEnv);
  } catch (err) {
    execErr = err;
  } finally {
    // Shutdown the IPC store after plugin execution completes
    closeStoreProm = kvStore.close();
  }

  const result: PoolExecResult = {
    output: output,
    err: execErr
  };
  result['type'] = 'pool_exec_result';

  processSend(result);

  // Wait for IPC store to finish shutting down before exiting
  await closeStoreProm;
};

pluginExecutor()
  .then(() => {
    _logger.debug('Pool process finished executing successfully');
  })
  .catch((err) => {
    _logger.error({ err }, 'Pool process failed execution with error');
  });
