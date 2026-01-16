import { SpanKind } from '@opentelemetry/api';
import {
  ActionConfiguration,
  BasePlugin,
  ConnectionPoolCoordinator,
  DatasourceConfiguration,
  ExecutionOutput,
  IntegrationError,
  PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE,
  PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE,
  sanitizeAgentKey
} from '@superblocks/shared';
import P from 'pino';
import {
  SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_DEFAULT,
  SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_PLUGINS,
  SUPERBLOCKS_CONTROLLER_KEY,
  SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS,
  SUPERBLOCKS_WORKER_EXECUTION_REST_API_MAX_CONTENT_LENGTH_BYTES,
  SUPERBLOCKS_WORKER_EXECUTION_REST_API_TIMEOUT_MS
} from './env';
import { DurationQuotaError, QuotaError } from './errors';
import logger from './logger';
import { StepPerformanceImpl } from './performance/step';
import { StepPerformance } from './performance/types';
import { clear, observe } from './performance/utils';
import { SUPERBLOCKS_PLUGIN_PACKAGE_PREFIX } from './plugin';
import { ExecutionOutputPropsBuilder } from './plugin-property/builder/builders';
import { PluginPropsReader } from './plugin-property/delegates/reader';
import { PluginPropsWriter } from './plugin-property/delegates/writer';
import { PluginProps } from './plugin-property/plugin-props';
import { remoteError, remoteInfo, remoteLogStructured } from './remoteLogger';
import { OBS_CORRELATION_ID_TAG, getTracer } from './tracer';
import {
  BindingKeyAndType,
  BindingType,
  Event,
  ExecuteRequest,
  ExecuteResponse,
  KVStore,
  MetadataRequest,
  MetadataResponse,
  Plugin,
  PluginDefinition,
  PreDeleteRequest,
  PreDeleteResponse,
  Response,
  RunOptions,
  StreamRequest,
  TestRequest,
  TestResponse
} from './types';
import { spanned } from './utils';

/**
 * TODO(frank): this could be implemented in {@link BasePlugin}
 */
export class Shim<T extends BasePlugin> implements Plugin {
  public name: string;

  private _plugin: T;
  private _logger: P.Logger;
  private _kv: KVStore;

  private constructor(
    pd: PluginDefinition,
    plugin: T,
    kv: KVStore,
    connectionPoolCoordinator: ConnectionPoolCoordinator,
    _logger?: P.Logger
  ) {
    this._plugin = plugin;
    this._kv = kv;
    this.name = pd.name;
    this._logger = _logger || logger.child({ name: this.name });
    this._plugin.attachLogger(this._logger);
    this._plugin.attachTracer(getTracer());
    this.run = this.run.bind(this);
    this._plugin.attachConnectionPool(connectionPoolCoordinator);
  }

  // Using the static factory function pattern.
  static async init(
    pd: PluginDefinition,
    connectionPoolCoordinator: ConnectionPoolCoordinator,
    plugins: Record<string, unknown>,
    kv: KVStore
  ): Promise<Plugin> {
    const searchKey = `${SUPERBLOCKS_PLUGIN_PACKAGE_PREFIX}${pd.name}`;
    const pluginAlias = Object.keys(plugins).find((key): boolean => key === searchKey);
    const plugin = plugins[pluginAlias] as BasePlugin;
    if (!plugin) {
      throw new Error(
        `Plugin ${pd.name} ('${searchKey}') was not found. Supported plugin aliases: ${JSON.stringify(Object.keys(plugins), null, 2)}.`
      );
    }

    plugin.configure({
      pythonExecutionTimeoutMs: '1_200_000',
      javascriptExecutionTimeoutMs: SUPERBLOCKS_WORKER_EXECUTION_JS_TIMEOUT_MS,
      restApiExecutionTimeoutMs: SUPERBLOCKS_WORKER_EXECUTION_REST_API_TIMEOUT_MS,
      restApiMaxContentLengthBytes: SUPERBLOCKS_WORKER_EXECUTION_REST_API_MAX_CONTENT_LENGTH_BYTES,
      connectionPoolIdleTimeoutMs: SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_PLUGINS[pd.name] ?? SUPERBLOCKS_CONNECTION_CACHE_TTL_MS_DEFAULT,
      workflowFetchAndExecuteFunc: null // Workflows are flattened by the controller.
    });

    try {
      plugin.init();
    } catch (_) {
      // BasePlugin.(init|shutdown) are not abstract. Rather, they have no-op implementations.
      // However, i'm getting property doesn't exist exception if the subclass doesn't overwrite it. I'm probably
      // not understanding something so i'm wrapping it.
    }

    return new Shim(pd, plugin, kv, connectionPoolCoordinator);
  }

  private convertPluginConfigTypesInPlace(pluginProps: PluginProps): void {
    pluginProps.actionConfiguration = this.convertActionConfig(pluginProps.actionConfiguration);
    pluginProps.datasourceConfiguration = this.convertDatasourceConfig(pluginProps.datasourceConfiguration);
  }

  private convertDatasourceConfig(datasourceConfigurationOriginal): DatasourceConfiguration {
    try {
      if (Object.keys(PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE).includes(this.name)) {
        const datasourceConfiguration =
          PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE[this.name](datasourceConfigurationOriginal);

        // TODO currently ui plugin templates, orchastrator rely on authConfig to pass accessToken to plugin
        // We need to set it here becasue above call will remove un-recognize fields (from proto types' perspective)
        // We should consider adding the similar field in proto types down road
        datasourceConfiguration['authConfig'] = datasourceConfigurationOriginal['authConfig'];
        return datasourceConfiguration;
      } else {
        return datasourceConfigurationOriginal;
      }
    } catch (err) {
      this._logger.warn(`unmarshal datasourceConfig failed`);
      return datasourceConfigurationOriginal;
    }
  }

  private convertActionConfig(actionConfiguration): ActionConfiguration {
    try {
      if (Object.keys(PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE).includes(this.name)) {
        return PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE[this.name](actionConfiguration);
      } else {
        return actionConfiguration;
      }
    } catch (err) {
      this._logger.warn(`unmarshal actionConfig failed`);
      return actionConfiguration;
    }
  }

  private async constructPluginProps(
    _request: ExecuteRequest | StreamRequest,
    _event: Event,
    _perf: StepPerformanceImpl,
    _obsTags: Record<string, string> = {}
  ): Promise<PluginProps> {
    const { _kv } = this;
    const _logger = this._logger.child({ event: _event, ..._obsTags });

    // Need to set add bindingKeys for legacy binding resolution in worker
    // TODO: remove this by doing all binding resolution in orchestrator
    const pluginPropsPartial = _request.props;
    pluginPropsPartial.bindingKeys ||= new Array<BindingKeyAndType>();
    for (const [key, variable] of Object.entries(pluginPropsPartial.variables ?? {})) {
      if (!pluginPropsPartial.bindingKeys.find((bindingKey): boolean => bindingKey.key === key)) {
        let bindingType: BindingType;

        if (variable.key?.includes('.output.')) {
          bindingType = BindingType.Output;
        } else if (variable.key?.includes('.global.')) {
          bindingType = BindingType.Global;
        } else {
          continue;
        }

        pluginPropsPartial.bindingKeys.push({ type: bindingType, key: key });
      }
    }

    const _reader = new PluginPropsReader().loadFromStream(_request);

    await spanned<void>(getTracer(), 'fetch.bindings', SpanKind.INTERNAL, async (): Promise<void> => {
      await observe<PluginPropsReader>(
        this._logger,
        _perf.kvStoreFetch,
        async (): Promise<PluginPropsReader> => _reader.loadFromStore(_kv)
      );
    });

    const [, numBindings, numBytes] = _reader.stats();

    _perf.kvStoreFetch.bytes = numBytes;
    _perf.bindings.data = numBindings;

    /**
     * We only want to observe this metric if we actually end up communicating with the store.
     * I don't think it makes sense to polute the abstractions that handle that with this performance type.
     * Hence, if the stats show that nothing was read from the store, we're going to unset the metrics.
     */
    if (numBindings === 0) {
      clear(_perf.kvStoreFetch);
    }

    const pluginProps = _reader.build();
    _logger.debug({ pluginProps }, 'Constructed plugin properties');

    pluginProps.context.addGlobalVariable('$agentKey', sanitizeAgentKey(SUPERBLOCKS_CONTROLLER_KEY));
    pluginProps.redactedContext.addGlobalVariable('$agentKey', sanitizeAgentKey(SUPERBLOCKS_CONTROLLER_KEY));
    pluginProps.quotas = _request.quotas;
    pluginProps.context.kvStore = this._kv;
    pluginProps.context.variables = pluginProps.variables ?? {};
    pluginProps.redactedContext.kvStore = this._kv;
    pluginProps.redactedContext.variables = pluginProps.variables ?? {};
    pluginProps.context.useWasmBindingsSandbox = pluginProps.useWasmBindingsSandbox;
    pluginProps.redactedContext.useWasmBindingsSandbox = pluginProps.useWasmBindingsSandbox;
    pluginProps.version = _request.props.version;

    this.convertPluginConfigTypesInPlace(pluginProps);

    return pluginProps;
  }

  public async run(options: RunOptions): Promise<Response> {
    let errorName = IntegrationError.name;
    const { _kv, _plugin } = this;

    switch (options.event) {
      case Event.STREAM: {
        if (!options.send) {
          this._logger.error('A send function must be sent for stream events');
          throw new Error('Internal Error');
        }

        const pluginProps = await this.constructPluginProps(options.request as StreamRequest, options.event, options.perf);
        // This wraps the trace...
        return await spanned<void>(
          getTracer(),
          `stream.plugin.${this.name}`,
          SpanKind.INTERNAL,
          async (): Promise<void> =>
            // ...and this wraps the metric.
            await observe<void>(
              this._logger,
              options.perf.pluginExecution,
              // NOTE(frank): In Event.EXECUTE, we're calling the wrapper, 'setupAndExecute'. This takes in a different type.
              //              Why, idk... We may have to do that here too to handle some binding resolution but currently, the
              //              orchestrator is resolving action configuration bindings (that may be incorrect and worse performance).
              //              To work around the type variance, I'm adding the missing field for now. Will revisit.
              async (): Promise<void> =>
                await _plugin.stream({ ...{ mutableOutput: new ExecutionOutput() }, ...pluginProps }, options.send, {
                  until: options.until
                })
            )
        );
      }

      case Event.EXECUTE: {
        const request: ExecuteRequest = options.request as ExecuteRequest;
        const observabilityTags: Record<string, string> = {
          [OBS_CORRELATION_ID_TAG]: request.props.executionId,
          ...options.observabilityTags
        };
        const pluginProps = await this.constructPluginProps(request, options.event, options.perf, observabilityTags);
        const logger: P.Logger = this._logger.child(observabilityTags);

        const executionOutput: ExecutionOutput = await spanned<ExecutionOutput>(
          getTracer(),
          `execute.plugin.${this.name}`,
          SpanKind.INTERNAL,
          async (): Promise<ExecutionOutput> => {
            return await observe<ExecutionOutput>(logger, options.perf.pluginExecution, async (): Promise<ExecutionOutput> => {
              try {
                // Attach the logger with correlation ID and observability tags context to the plugin
                _plugin.attachLogger(logger);
                return await _plugin.setupAndExecute(pluginProps);
              } finally {
                // Detach the context specific logger from the plugin once execution is complete
                _plugin.attachLogger(this._logger);
              }
            });
          }
        );

        if (executionOutput.error?.includes('[AbortError]')) {
          const error = new DurationQuotaError(DurationQuotaError.name);
          errorName = error.name;
          executionOutput.error = error.message;
          executionOutput.log = [];
          executionOutput.structuredLog = [];
        }

        if (executionOutput.log?.length > 0) {
          if (executionOutput.log.length === executionOutput.structuredLog?.length) {
            remoteLogStructured(executionOutput.structuredLog, observabilityTags);
          } else {
            remoteInfo(executionOutput.log, observabilityTags);
          }
        }

        if (executionOutput.error) {
          remoteError([executionOutput.error], observabilityTags);
        }

        const flushOutput = async (_perf: StepPerformance, _output: ExecutionOutput): Promise<string> => {
          const redactedOutput = { ..._output, structuredLog: undefined } as ExecutionOutput;
          const builder = new ExecutionOutputPropsBuilder(
            pluginProps.executionId,
            pluginProps.stepName,
            redactedOutput,
            pluginProps.version
          );
          const writer = new PluginPropsWriter({
            baggage: request.baggage,
            maxSize: request.quotas?.size
          });
          writer.load(builder);

          const key: string = await spanned<string>(
            getTracer(),
            'push.output',
            SpanKind.INTERNAL,
            async (): Promise<string> =>
              await observe<string>(logger, _perf.kvStorePush, async (): Promise<string> => (await writer.writeStore(_kv))[0])
          );

          _perf.kvStorePush.bytes = writer.stats()[0];

          return key;
        };

        let outputStoreKey: string;
        {
          try {
            outputStoreKey = await flushOutput(options.perf, executionOutput);
          } catch (err) {
            // NOTE(frank): This code is gross. The main issue is because product requires
            //              a separate error message for workflows vs. apis and because the
            //              error must also be on the step, it forces the exact error to be here.
            if (err.name === QuotaError.name) {
              errorName = QuotaError.name;

              // This doesn't matter. We're going to overwrite QuotaError messages in the
              // controller so that we can apply business logic to the error message.
              executionOutput.error = new QuotaError(QuotaError.name).message;

              // In order to retain the contract of errors being included in the step output,
              // We need to clear the output, add the error, and re-flush. In the future, we
              // should revisit how this flow works.
              executionOutput.output = {};
              outputStoreKey = await flushOutput(options.perf, executionOutput);
            } else {
              throw err;
            }
          }
        }

        return {
          err: executionOutput.error
            ? {
                name: errorName,
                message: executionOutput.error
              }
            : undefined,
          key: outputStoreKey
        } as ExecuteResponse;
      }
      case Event.TEST: {
        const datasourceConfig = this.convertDatasourceConfig((options.request as TestRequest).dConfig);
        return await observe<TestResponse>(this._logger, options.perf.pluginExecution, async (): Promise<TestResponse> => {
          const testResponse = await _plugin.test(datasourceConfig, (options.request as TestRequest).aConfig);
          return testResponse;
        });
      }
      case Event.PRE_DELETE: {
        return await observe<PreDeleteResponse>(
          this._logger,
          options.perf.pluginExecution,
          async (): Promise<PreDeleteResponse> => await _plugin.preDelete((options.request as PreDeleteRequest).dConfig)
        );
      }
      case Event.METADATA: {
        const request: MetadataRequest = options.request as MetadataRequest;
        const datasourceConfig = this.convertDatasourceConfig(request.dConfig);
        const actionConfig = this.convertActionConfig(request.aConfig);
        return await observe<MetadataResponse>(
          this._logger,
          options.perf.pluginExecution,
          async (): Promise<MetadataResponse> => await _plugin.metadata(datasourceConfig, actionConfig)
        );
      }
      default: {
        throw new Error(`unrecognized event ${options.event}`);
      }
    }
  }
}
