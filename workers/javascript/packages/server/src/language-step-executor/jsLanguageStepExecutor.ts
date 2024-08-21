import { SpanKind, Tracer } from '@opentelemetry/api';
import {
  ActionConfiguration,
  Closer,
  ExecutionOutput,
  getTreePathToDiskPath,
  IntegrationError,
  MaybeError,
  PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE,
  PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE,
  sanitizeAgentKey
} from '@superblocks/shared';
import JavascriptPlugin from '@superblocksteam/javascript';
import P from 'pino';
import { SUPERBLOCKS_CONTROLLER_KEY } from '../env';
import { DurationQuotaError, QuotaError } from '../errors';
import { StepPerformance } from '../performance/types';
import { clear, observe } from '../performance/utils';
import { ExecutionOutputPropsBuilder } from '../plugin-property/builder/builders';
import { PluginPropsReader } from '../plugin-property/delegates/reader';
import { PluginPropsWriter } from '../plugin-property/delegates/writer';
import { PluginProps } from '../plugin-property/plugin-props';
import { remoteError, remoteLogStructured } from '../remoteLogger';
import { OBS_CORRELATION_ID_TAG } from '../tracer';
import { BindingKeyAndType, BindingType, Event, ExecuteRequest, ExecuteResponse, KVStore } from '../types';
import { spanned } from '../utils';
import { ExecutionPool } from './executionPool';

export class JsLanguageStepExecutor implements Closer {
  private static JS_PLUGIN_NAME = 'javascript';
  private static JS_PLUGIN = new JavascriptPlugin();
  private _defaultExecutionTimeout: string;
  private _logger: P.Logger;
  private _tracer: Tracer;
  private _kvStore: KVStore;
  private _execPool: ExecutionPool;
  private _shuttingDown: boolean;

  private constructor(kvStore: KVStore, execPool: ExecutionPool, defaultExecutionTimeout: string, logger: P.Logger, tracer: Tracer) {
    this._kvStore = kvStore;
    this._execPool = execPool;
    this._defaultExecutionTimeout = defaultExecutionTimeout;
    this._logger = logger;
    this._tracer = tracer;
    this._shuttingDown = false;
  }

  public static init(
    kvStore: KVStore,
    execPool: ExecutionPool,
    defaultExecutionTimeout: string,
    logger: P.Logger,
    tracer: Tracer
  ): JsLanguageStepExecutor {
    const _logger = logger.child({ event: Event.EXECUTE });

    return new JsLanguageStepExecutor(kvStore, execPool, defaultExecutionTimeout, _logger, tracer);
  }

  public get executionPool(): ExecutionPool {
    return this._execPool;
  }

  private _createOrUpdateRequestProps(request: ExecuteRequest): void {
    const pluginPropsPartial = request.props;
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
  }

  private async _loadPropsFromStreamAndStore(request: ExecuteRequest, perf: StepPerformance): Promise<PluginPropsReader> {
    const reader = new PluginPropsReader().loadFromStream(request);

    await spanned<void>(this._tracer, 'fetch.bindings', SpanKind.INTERNAL, async (): Promise<void> => {
      await observe<PluginPropsReader>(
        this._logger,
        perf.kvStoreFetch,
        async (): Promise<PluginPropsReader> => reader.loadFromStore(this._kvStore)
      );
    });

    const [, numBindings, numBytes] = reader.stats();

    perf.kvStoreFetch.bytes = numBytes;
    perf.bindings.data = numBindings;

    // We only want to observe this metric if we actually end up communicating with the store.
    if (numBindings === 0) {
      clear(perf.kvStoreFetch);
    }

    return reader;
  }

  private _convertActionConfig(actionConfiguration, observabilityTags: Record<string, string>): ActionConfiguration {
    try {
      if (Object.keys(PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE).includes(JsLanguageStepExecutor.JS_PLUGIN_NAME)) {
        return PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE[JsLanguageStepExecutor.JS_PLUGIN_NAME](actionConfiguration);
      } else {
        return actionConfiguration;
      }
    } catch (err) {
      this._logger.warn(observabilityTags, 'unmarshal actionConfig failed');
      return actionConfiguration;
    }
  }

  private async _constructPluginProps(
    request: ExecuteRequest,
    perf: StepPerformance,
    observabilityTags: Record<string, string>
  ): Promise<PluginProps> {
    // Need to set/add bindingKeys for legacy binding resolution in worker
    // TODO: remove this by doing all binding resolution in orchestrator
    this._createOrUpdateRequestProps(request);
    const _reader = await this._loadPropsFromStreamAndStore(request, perf);

    const pluginProps = _reader.build();
    this._logger.debug({ pluginProps, ...observabilityTags }, 'Constructed plugin properties');

    pluginProps.context.addGlobalVariable('$agentKey', sanitizeAgentKey(SUPERBLOCKS_CONTROLLER_KEY));
    pluginProps.redactedContext.addGlobalVariable('$agentKey', sanitizeAgentKey(SUPERBLOCKS_CONTROLLER_KEY));
    pluginProps.quotas = request.quotas;
    pluginProps.context.kvStore = this._kvStore;
    pluginProps.context.variables = pluginProps.variables ?? {};
    pluginProps.redactedContext.kvStore = this._kvStore;
    pluginProps.redactedContext.variables = pluginProps.variables ?? {};
    pluginProps.version = request.props.version;

    pluginProps.actionConfiguration = this._convertActionConfig(pluginProps.actionConfiguration, observabilityTags);

    return pluginProps;
  }

  private async _writeOutputToKvStore(
    request: ExecuteRequest,
    pluginProps: PluginProps,
    perf: StepPerformance,
    output: ExecutionOutput,
    observabilityTags: Record<string, string>
  ): Promise<string> {
    const redactedOutput = { ...output, structuredLog: undefined } as ExecutionOutput;
    const builder = new ExecutionOutputPropsBuilder(pluginProps.executionId, pluginProps.stepName, redactedOutput, pluginProps.version);
    const writer = new PluginPropsWriter({
      baggage: request.baggage,
      maxSize: request.quotas?.size
    });
    writer.load(builder);

    const key: string = await spanned<string>(
      this._tracer,
      'push.output',
      SpanKind.INTERNAL,
      async (): Promise<string> =>
        await observe<string>(
          this._logger.child(observabilityTags),
          perf.kvStorePush,
          async (): Promise<string> => (await writer.writeStore(this._kvStore))[0]
        )
    );

    perf.kvStorePush.bytes = writer.stats()[0];

    return key;
  }

  private async _flushOutputToKvStore(
    request: ExecuteRequest,
    pluginProps: PluginProps,
    baggage: Record<string, string>,
    perf: StepPerformance,
    output: ExecutionOutput
  ): Promise<ExecuteResponse> {
    let errorName = IntegrationError.name;
    if (output.error?.includes('[AbortError]')) {
      const error = new DurationQuotaError(DurationQuotaError.name);
      errorName = error.name;
      output.error = error.message;
      output.log = [];
      output.structuredLog = [];
    }

    remoteLogStructured(output.structuredLog, baggage);
    if (output.error) {
      remoteError([output.error], baggage);
    }

    let outputStoreKey: string;
    {
      try {
        outputStoreKey = await this._writeOutputToKvStore(request, pluginProps, perf, output, baggage);
      } catch (err) {
        // NOTE(frank): This code is gross. The main issue is because product requires
        //              a separate error message for workflows vs. apis and because the
        //              error must also be on the step, it forces the exact error to be here.
        if (err.name === QuotaError.name) {
          errorName = QuotaError.name;

          // This doesn't matter. We're going to overwrite QuotaError messages in the
          // controller so that we can apply business logic to the error message.
          output.error = QuotaError.name;

          // In order to retain the contract of errors being included in the step output,
          // We need to clear the output, add the error, and re-flush. In the future, we
          // should revisit how this flow works.
          output.output = {};
          outputStoreKey = await this._writeOutputToKvStore(request, pluginProps, perf, output, baggage);
        } else {
          throw err;
        }
      }
    }

    return {
      err: output.error
        ? {
            name: errorName,
            message: output.error
          }
        : undefined,
      key: outputStoreKey
    } as ExecuteResponse;
  }

  public async ExecuteStep(request: ExecuteRequest, baggage: Record<string, string>, perf: StepPerformance): Promise<ExecuteResponse> {
    if (this._shuttingDown) {
      throw new Error('Cannot execute step, JavaScript Language Executor is shutting down');
    }

    const observabilityTags: Record<string, string> = {
      [OBS_CORRELATION_ID_TAG]: request.props.executionId,
      ...baggage
    };
    const _logger = this._logger.child(observabilityTags);

    _logger.debug('Executing step');

    const pluginProps = await this._constructPluginProps(request, perf, observabilityTags);
    const rawRequest = // @ts-ignore
      (await JsLanguageStepExecutor.JS_PLUGIN.evaluateActionConfig(pluginProps.redactedContext, pluginProps.actionConfiguration)).body;
    const filePaths = getTreePathToDiskPath(pluginProps.context.globals, pluginProps.files);

    const executionOutput: ExecutionOutput = await spanned<ExecutionOutput>(
      this._tracer,
      `execute.plugin.${JsLanguageStepExecutor.JS_PLUGIN_NAME}`,
      SpanKind.INTERNAL,
      async (): Promise<ExecutionOutput> => {
        return await observe<ExecutionOutput>(_logger, perf.pluginExecution, async (): Promise<ExecutionOutput> => {
          return await this._execPool.ExecutePlugin(
            JsLanguageStepExecutor.JS_PLUGIN_NAME,
            pluginProps,
            rawRequest,
            filePaths,
            this._defaultExecutionTimeout,
            observabilityTags
          );
        });
      }
    );

    return this._flushOutputToKvStore(request, pluginProps, observabilityTags, perf, executionOutput);
  }

  public async close(reason?: string): Promise<MaybeError> {
    this._shuttingDown = true;
  }
}
