import { context, SpanKind, SpanStatusCode, trace, Tracer } from '@opentelemetry/api';
import _, { isEmpty } from 'lodash';
import P from 'pino';
import { ErrorCode, ForbiddenError, IntegrationError, UnauthorizedError } from '../../errors';
import { RelayDelegate } from '../../relay';
import {
  ActionConfiguration,
  DatasourceConfiguration,
  DatasourceMetadataDto,
  ExecutionContext,
  ExecutionOutput,
  ForwardedCookies,
  PlaceholdersInfo,
  PluginCommon,
  RawRequest,
  ResolvedActionConfigurationProperty,
  SecretsConfiguration,
  SharedSSHAuthMethod,
  SSHAuthConfiguration
} from '../../types';
import { ActionConfigurationResolutionContext, addErrorSuggestion, getTagsFromContext } from '../../utils';
import { AgentCredentials } from '../auth';
import { PluginConfiguration } from '../configuration';
import { RecursionContext, resolveActionConfiguration } from '../execution';
import { RequestFiles } from '../files';
import { ConnectionPoolCoordinator } from '../pool';

// DEFER(taha) proj:profiles Workflow is the only integration that requires profile-awareness. As such,
// we should clean up the PluginExecutionProps type, and create a workflow-specific props type that includes
// profile/environment/etc
export interface PluginExecutionProps<DCType = DatasourceConfiguration, ACType = ActionConfiguration> {
  mutableOutput: ExecutionOutput;
  context: ExecutionContext;
  datasourceConfiguration: DCType;
  actionConfiguration: ACType;
  files: RequestFiles;
  agentCredentials: AgentCredentials;
  recursionContext: RecursionContext;
  relayDelegate: RelayDelegate;
  forwardedCookies?: ForwardedCookies;
  quotas?: Record<string, number>;
  environment?: string;
  profileId?: string;
  profile?: string;
}

// TODO(frank): This could probably use a better name.
export interface PluginProps {
  context: ExecutionContext;
  redactedContext: ExecutionContext;
  agentCredentials: AgentCredentials;
  redactedDatasourceConfiguration: DatasourceConfiguration;
  datasourceConfiguration: DatasourceConfiguration;
  actionConfiguration: ActionConfiguration;
  files: RequestFiles;
  recursionContext: RecursionContext;
  relayDelegate: RelayDelegate;
  forwardedCookies?: ForwardedCookies;
  quotas?: Record<string, number>;
  environment?: string;
  profileId?: string;
  profile?: string;
  render?: boolean;
}

export interface StreamOptions {
  /**
   * Some streamable plugins that run forever (i.e. Kafka) need to be told when to stop.
   * This method abstracts that logic away from the plugin as it may be transport specific.
   *
   * An example usage woul be for the cloud where we'd stop a stream if the orchestrator
   * has stopped subscribing to a channel.
   *
   * @returns true if the stream should be stopped, false otherwise
   */
  until?: () => Promise<void>;
}

export function Trace(spanName: string, errorMessage?: string, additionalTraceTags?: Record<string, string>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  return function (target: BasePlugin, name: string, descriptor: PropertyDescriptor) {
    const fn = descriptor.value;
    descriptor.value = async function (...args) {
      return this.tracer.startActiveSpan(
        spanName,
        {
          attributes: {
            ...this.getTraceTags(),
            ...additionalTraceTags
          },
          kind: SpanKind.SERVER
        },
        async (span) => {
          try {
            const result = await fn.apply(this, args);
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (err) {
            span.setStatus({ code: SpanStatusCode.ERROR });
            span.recordException(err);
            throw new IntegrationError(`${errorMessage}: ${err}`, ErrorCode.UNSPECIFIED, { stack: err.stack });
          } finally {
            span.end();
          }
        }
      );
    };
    return descriptor;
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function ResolveActionConfigurationProperty(target: BasePlugin, name: string, descriptor: PropertyDescriptor) {
  const fn = descriptor.value;
  descriptor.value = async function (...args) {
    return this.tracer.startActiveSpan(
      'plugin.resolveActionConfigurationProperty',
      {
        attributes: this.getTraceTags(),
        kind: SpanKind.SERVER
      },
      async (span) => {
        try {
          const result = await fn.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.recordException(err);
          throw new IntegrationError(
            `failed to resolve action configuration for ${this.name()}: ${err}`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
          );
        } finally {
          span.end();
        }
      }
    );
  };
  return descriptor;
}

export abstract class BasePlugin {
  logger: P.Logger;
  tracer: Tracer;
  pluginConfiguration: PluginConfiguration;
  protected secretStore: SecretsConfiguration;
  protected pluginName: string;

  public constructor(secretStore?: SecretsConfiguration) {
    this.tracer = trace.getTracer('plugin');
    if (secretStore) {
      this.secretStore = secretStore;
    }
  }

  public attachLogger(logger: P.Logger): void {
    this.logger = logger;
  }

  public attachTracer(tracer: Tracer): void {
    this.tracer = tracer;
  }

  public getTraceTags(): Record<string, string> {
    return getTagsFromContext(context.active());
  }

  public configure(pluginConfiguration: PluginConfiguration): void {
    this.pluginConfiguration = pluginConfiguration;
  }

  public attachConnectionPool(connectionPoolCoordinator: ConnectionPoolCoordinator): void {
    // do nothing by default, override in DB plugins that need a connection pool
  }

  // BEWARE ALL DEVELOPERS!
  // IMPLEMENT LIKE THIS:
  // execute({...}: PluginExecutionProps<MyCustomDatasourceConfiguration>): Promise<ExecutionOutput>
  // AND NOT LIKE THIS:
  // execute({...}: PluginExecutionProps<MyCustomDatasourceConfiguration, MyCustomActionConfiguration>): Promise<ExecutionOutput>
  public abstract execute(executionProps: PluginExecutionProps): Promise<undefined | ExecutionOutput>;

  public async stream(_props: PluginExecutionProps, _send: (_message: unknown) => Promise<void>, _options?: StreamOptions): Promise<void> {
    throw new Error('This plugin does not support streaming.');
  }

  getRequest(actionConfiguration: ActionConfiguration, datasourceConfiguration: DatasourceConfiguration, files: RequestFiles): RawRequest {
    return undefined;
  }

  // (e.g. API based plugins will have different metadata than database plugins)
  public abstract metadata(
    datasourceConfiguration: DatasourceConfiguration,
    actionConfiguration?: ActionConfiguration
  ): Promise<DatasourceMetadataDto>;

  public abstract test(datasourceConfiguration: DatasourceConfiguration): Promise<void>;
  public abstract test(datasourceConfiguration: DatasourceConfiguration, actionConfiguration: ActionConfiguration): Promise<void>;

  // method that will be executed before deleting a plugin from database
  public preDelete(datasourceConfiguration: DatasourceConfiguration): Promise<void> {
    // No-op
    return Promise.resolve();
  }

  //TODO for plugin templates to be more declarative, we should consider
  // parsing all action/datasource configurations instead of hardcoding the fields here
  public abstract dynamicProperties(): Array<string>;

  // No-op to be implemented by child class
  public init(): void {
    // No-op
  }

  // No-op to be implemented by child class
  public shutdown(): void {
    // No-op
  }

  // escapeStringProperties specifies the properties whose bindings should be
  // string escaped.
  public escapeStringProperties(): Array<string> {
    return [];
  }

  public name(): string {
    return this.constructor.name;
  }

  public async timedExecute({
    mutableOutput,
    context,
    datasourceConfiguration,
    actionConfiguration,
    files,
    agentCredentials,
    recursionContext,
    relayDelegate,
    forwardedCookies,
    quotas,
    environment,
    profileId,
    profile
  }: {
    mutableOutput: ExecutionOutput;
    context: ExecutionContext;
    datasourceConfiguration: DatasourceConfiguration;
    actionConfiguration: ActionConfiguration;
    files: RequestFiles;
    agentCredentials: AgentCredentials;
    recursionContext: RecursionContext;
    relayDelegate: RelayDelegate;
    forwardedCookies?: ForwardedCookies;
    quotas?: Record<string, number>;
    environment?: string;
    profileId?: string;
    profile?: string;
  }): Promise<undefined> {
    const startTime = new Date();
    mutableOutput.startTimeUtc = startTime;
    try {
      const innerOutput = await this.execute({
        mutableOutput,
        context,
        datasourceConfiguration,
        actionConfiguration,
        files,
        agentCredentials,
        recursionContext,
        relayDelegate,
        forwardedCookies,
        quotas,
        environment,
        profileId,
        profile
      });
      if (innerOutput instanceof ExecutionOutput) {
        if (innerOutput === mutableOutput) {
          // This is a developer warning because `mutableOutput` is not returnable
          throw new TypeError(`Plugin ${this.name()} is duplicating its output`);
        }
        mutableOutput.error = innerOutput.error;
        mutableOutput.log = mutableOutput.log.concat(innerOutput.log);
        mutableOutput.structuredLog = mutableOutput.structuredLog.concat(innerOutput.structuredLog);
        mutableOutput.output = innerOutput.output;
      }
    } catch (e) {
      mutableOutput.executionTime = Date.now() - startTime.getTime();
      throw e;
    }
    mutableOutput.executionTime = Date.now() - startTime.getTime();
    return;
  }

  @ResolveActionConfigurationProperty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async resolveActionConfigurationProperty(
    resolutionContext: ActionConfigurationResolutionContext
  ): Promise<ResolvedActionConfigurationProperty> {
    if (resolutionContext.disabled) {
      return {
        resolved: _.get(resolutionContext.actionConfiguration, resolutionContext.property)
      };
    }

    return resolveActionConfiguration(
      resolutionContext.context,
      resolutionContext.actionConfiguration,
      resolutionContext.files,
      resolutionContext.property,
      resolutionContext.escapeStrings
    );
  }

  /**
   * Instead of throwing errors to caller, we set the error
   * in the ExecutionOutput and return it to the caller
   */
  public async setupAndExecute({
    context,
    redactedContext,
    agentCredentials,
    redactedDatasourceConfiguration,
    datasourceConfiguration,
    actionConfiguration,
    files,
    recursionContext,
    relayDelegate,
    forwardedCookies,
    quotas,
    environment,
    profileId,
    profile,
    render
  }: PluginProps): Promise<ExecutionOutput> {
    const outputWrapper = new ExecutionOutput();

    let rawRequest: RawRequest;
    let placeholdersInfo: PlaceholdersInfo | undefined;
    try {
      // resolve dynamic ActionConfiguration properties
      for (const property of this.dynamicProperties()) {
        if (!_.get(actionConfiguration, property, undefined)) {
          // dynamic property has not been set.
          continue;
        }

        const shouldEscapeProperty = this.escapeStringProperties().includes(property);
        const resolvedPropery = await this.resolveActionConfigurationProperty({
          context: redactedContext,
          actionConfiguration,
          files,
          property,
          escapeStrings: shouldEscapeProperty,
          disabled: render === undefined ? false : !render
        });
        _.set(actionConfiguration, property, resolvedPropery.resolved);
        context.preparedStatementContext = redactedContext.preparedStatementContext;
        placeholdersInfo ??= resolvedPropery.placeholdersInfo;
      }
      rawRequest = this.getRequest(actionConfiguration, redactedDatasourceConfiguration, files);
      outputWrapper.request = rawRequest;
      if (placeholdersInfo) outputWrapper.placeholdersInfo = placeholdersInfo;
    } catch (err) {
      err.message = addErrorSuggestion(err.message);
      outputWrapper.logError(`Error evaluating bindings: ${err.message.replace('error evaluating ', '')}`);
      outputWrapper.integrationErrorCode = err?.code;
      this.logger.info(`Evaluating bindings for API step ${this.name()} failed with error: ${err.message}`);
      return outputWrapper;
    }

    const localContext = new ExecutionContext(context);

    try {
      await this.timedExecute({
        mutableOutput: outputWrapper,
        context: localContext,
        datasourceConfiguration,
        actionConfiguration,
        files,
        agentCredentials,
        recursionContext,
        relayDelegate,
        forwardedCookies,
        quotas,
        environment,
        profileId,
        profile
      });
      if (placeholdersInfo) outputWrapper.placeholdersInfo = placeholdersInfo;
      this.logger.info(`Executing API step ${this.name()} took ${outputWrapper.executionTime}ms`);
    } catch (err) {
      outputWrapper.logError(err.message, err instanceof ForbiddenError || err instanceof UnauthorizedError);
      this.logger.info(`Executing API step ${this.name()} failed with error: ${err.message}`);
    }
    return outputWrapper;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function measureQueryTime(cb: () => Promise<any>): Promise<{ result: any; time: string }> {
  const start = performance.now();
  const result = await cb();
  return {
    result,
    time: (performance.now() - start).toFixed()
  };
}

export function getKeyFromSSHAuthMethod(secretStore: SecretsConfiguration, authConfig: SSHAuthConfiguration): string {
  if (!isEmpty(authConfig.authMethod)) {
    const mapping: Record<number, string> = {
      [SharedSSHAuthMethod.PUB_KEY_RSA]: 'PRIVATE_KEY_RSA',
      [SharedSSHAuthMethod.PUB_KEY_ED25519]: 'PRIVATE_KEY_ED25519'
    };

    return secretStore[mapping[authConfig.authMethod ?? -1]] as string;
  }

  const mapping: Record<number, string> = {
    [PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA]: 'PRIVATE_KEY_RSA',
    [PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_ED25519]: 'PRIVATE_KEY_ED25519'
  };

  return secretStore[mapping[authConfig.authenticationMethod ?? PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_UNSPECIFIED]] as string;
}
