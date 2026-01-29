import {
  ActionConfiguration,
  BasePlugin,
  DatasourceConfiguration,
  ExecutionOutput,
  PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE,
  PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE
} from '@superblocks/shared';
import {
  BindingKeyAndType,
  BindingType,
  clear,
  Event,
  ExecuteRequest,
  KVStore,
  micros,
  getBaggageAsObjFromCarrier,
  MetadataRequest,
  MetadataResponse,
  OBS_CORRELATION_ID_TAG,
  observe,
  PluginProps,
  PluginPropsReader,
  PreDeleteRequest,
  SendFunc,
  StepPerformanceImpl,
  StreamRequest,
  TestRequest,
  UntilFunc
} from '@superblocks/worker.js';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import { Value } from 'google-protobuf/google/protobuf/struct_pb';
import P from 'pino';
import { SandboxStreamRequest } from './messageTransformer';
import { SandboxStreamingProxyServiceClient } from './types/worker/v1/sandbox_streaming_proxy_grpc_pb';
import { SendRequest, UntilRequest } from './types/worker/v1/sandbox_streaming_proxy_pb';

interface Variable {
  key: string;
  type: string;
  mode?: string;
}

export class PluginsRouter {
  private _logger: P.Logger;
  private _plugins: Record<string, BasePlugin>;
  private _streamingClient: SandboxStreamingProxyServiceClient;

  constructor(logger: P.Logger, streamingClient: SandboxStreamingProxyServiceClient) {
    this._logger = logger.child({ name: 'PluginsRouter' });
    this._streamingClient = streamingClient;
    this._plugins = {};
  }

  public registerPlugin(name: string, plugin: any) {
    plugin.attachLogger(this._logger.child({ pluginName: name }));
    this._plugins[name] = plugin;
  }

  public getPlugin(pluginName: string): BasePlugin {
    const plugin = this._plugins[pluginName];
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    return plugin;
  }

  public async handleExecuteEvent(pluginName: string, request: ExecuteRequest, kvStore: KVStore): Promise<ExecutionOutput> {
    const baggage = getBaggageAsObjFromCarrier(request.baggage || {});
    const observabilityTags = {
      [OBS_CORRELATION_ID_TAG]: request.props?.executionId ?? '',
      ...baggage
    };

    const plugin = this.getPlugin(pluginName);
    const perf = new StepPerformanceImpl({
      queueRequest: {
        end: micros(false)
      }
    });
    const pluginProps = await this.constructPluginProps(request, pluginName, Event.EXECUTE, kvStore, perf, observabilityTags);
    const originalLogger = plugin.logger;

    try {
      plugin.attachLogger(plugin.logger.child({ ...observabilityTags }));
      return await plugin.setupAndExecute(pluginProps);
    } finally {
      plugin.attachLogger(originalLogger);
    }
  }

  public async handleStreamEvent(
    pluginName: string,
    sandboxRequest: SandboxStreamRequest,
    kvStore: KVStore
  ): Promise<google_protobuf_empty_pb.Empty> {
    const topic = sandboxRequest.topic;
    const request = sandboxRequest.request;

    const baggage = getBaggageAsObjFromCarrier(request.baggage || {});
    const observabilityTags = {
      [OBS_CORRELATION_ID_TAG]: request.props?.executionId ?? '',
      ...baggage
    };

    const plugin = this.getPlugin(pluginName);
    const perf = new StepPerformanceImpl({
      queueRequest: {
        end: micros(false)
      }
    });
    const pluginProps = await this.constructPluginProps(request, pluginName, Event.STREAM, kvStore, perf, observabilityTags);
    const originalLogger = plugin.logger;

    try {
      plugin.attachLogger(plugin.logger.child({ ...observabilityTags }));
      await plugin.stream(
        {
          ...{ mutableOutput: new ExecutionOutput() },
          ...pluginProps
        },
        this.buildSendFunc(topic ?? 'deadletter'),
        {
          until: this.buildUntilFunc(topic)
        }
      );

      return new google_protobuf_empty_pb.Empty();
    } finally {
      plugin.attachLogger(originalLogger);
    }
  }

  public async handleMetadataEvent(pluginName: string, request: MetadataRequest): Promise<MetadataResponse> {
    const plugin = this.getPlugin(pluginName);

    const datasourceConfig = this.convertDatasourceConfig(pluginName, request.dConfig);
    const actionConfig = this.convertActionConfig(pluginName, request.aConfig);

    return await plugin.metadata(datasourceConfig, actionConfig);
  }

  public async handleTestEvent(pluginName: string, request: TestRequest): Promise<google_protobuf_empty_pb.Empty> {
    const plugin = this.getPlugin(pluginName);

    const datasourceConfig = this.convertDatasourceConfig(pluginName, request.dConfig);
    if (request.aConfig) {
      await plugin.test(datasourceConfig, request.aConfig);
    } else {
      await plugin.test(datasourceConfig);
    }

    return new google_protobuf_empty_pb.Empty();
  }

  public async handlePreDeleteEvent(pluginName: string, request: PreDeleteRequest): Promise<google_protobuf_empty_pb.Empty> {
    const plugin = this.getPlugin(pluginName);

    await plugin.preDelete(request.dConfig);
    return new google_protobuf_empty_pb.Empty();
  }

  private async constructPluginProps(
    request: ExecuteRequest | StreamRequest,
    pluginName: string,
    event: Event,
    kvStore: KVStore,
    perf: StepPerformanceImpl,
    obsTags: Record<string, string> = {}
  ): Promise<PluginProps> {
    const _logger = this._logger.child({ event: event, ...obsTags });

    // Need to set add bindingKeys for legacy binding resolution in worker
    // TODO: remove this by doing all binding resolution in orchestrator
    const pluginPropsPartial = request.props as Partial<PluginProps>;
    pluginPropsPartial.bindingKeys ||= new Array<BindingKeyAndType>();
    for (const [key, variable] of Object.entries(pluginPropsPartial.variables ?? {}) as [string, Variable][]) {
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

    const _reader = new PluginPropsReader().loadFromStream(request);
    await observe<PluginPropsReader>(
      this._logger,
      perf.kvStoreFetch,
      async (): Promise<PluginPropsReader> => _reader.loadFromStore(kvStore)
    );

    const [, numBindings, numBytes] = _reader.stats();

    perf.kvStoreFetch.bytes = numBytes;
    perf.bindings.data = numBindings;

    /**
     * We only want to observe this metric if we actually end up communicating with the store.
     * I don't think it makes sense to polute the abstractions that handle that with this performance type.
     * Hence, if the stats show that nothing was read from the store, we're going to unset the metrics.
     */
    if (numBindings === 0) {
      clear(perf.kvStoreFetch);
    }

    const pluginProps = _reader.build();
    _logger.debug({ pluginProps }, 'Constructed plugin properties');

    pluginProps.quotas = request.quotas;
    pluginProps.context.kvStore = kvStore;
    pluginProps.context.variables = pluginProps.variables ?? {};
    pluginProps.redactedContext.kvStore = kvStore;
    pluginProps.redactedContext.variables = pluginProps.variables ?? {};
    pluginProps.context.useWasmBindingsSandbox = pluginProps.useWasmBindingsSandbox;
    pluginProps.redactedContext.useWasmBindingsSandbox = pluginProps.useWasmBindingsSandbox;
    pluginProps.version = request.props.version;

    this.convertPluginConfigTypesInPlace(pluginName, pluginProps);

    return pluginProps;
  }

  private convertPluginConfigTypesInPlace(_pluginName: string, pluginProps: PluginProps): void {
    pluginProps.actionConfiguration = this.convertActionConfig(_pluginName, pluginProps.actionConfiguration);
    pluginProps.datasourceConfiguration = this.convertDatasourceConfig(_pluginName, pluginProps.datasourceConfiguration);
  }

  private convertActionConfig(pluginName: string, actionConfiguration): ActionConfiguration {
    try {
      if (Object.keys(PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE).includes(pluginName)) {
        return PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE[pluginName](actionConfiguration);
      } else {
        return actionConfiguration;
      }
    } catch (err) {
      this._logger.warn(`unmarshal actionConfig failed`);
      return actionConfiguration;
    }
  }

  private convertDatasourceConfig(pluginName: string, datasourceConfigurationOriginal): DatasourceConfiguration {
    try {
      if (Object.keys(PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE).includes(pluginName)) {
        const datasourceConfiguration =
          PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE[pluginName](datasourceConfigurationOriginal);

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

  private buildSendFunc(topic: string): SendFunc {
    return async (data: unknown): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const request = new SendRequest();
        request.setTopic(topic);
        request.setData(Value.fromJavaScript(JSON.parse(JSON.stringify(data))));

        this._streamingClient.send(request, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    };
  }

  private buildUntilFunc(topic?: string): UntilFunc | undefined {
    if (!topic) {
      return undefined;
    }

    return async (): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const request = new UntilRequest();
        request.setTopic(topic);

        this._streamingClient.until(request, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    };
  }
}
