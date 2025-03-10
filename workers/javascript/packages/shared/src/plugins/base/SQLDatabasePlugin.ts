import { AddressInfo, Server } from 'net';
import { SpanKind, SpanStatusCode, Tracer } from '@opentelemetry/api';
import { isEmpty } from 'lodash';
import { Client } from 'ssh2';
import { ErrorCode, IntegrationError } from '../../errors';
import {
  PlaceholdersInfo,
  PluginCommon,
  PostgresDatasourceConfiguration,
  ResolvedActionConfigurationProperty,
  SSHAuthConfiguration,
  SecretsConfiguration,
  SharedSSHAuthMethod
} from '../../types';
import { ActionConfigurationResolutionContext, showBoundValue } from '../../utils';
import { extractMustacheStrings, renderValueWithLoc, resolveAllBindings } from '../execution';
import { SqlOperations } from '../templates';
import { BasePlugin, ResolveActionConfigurationProperty, getKeyFromSSHAuthMethod } from './BasePlugin';

interface SSHTunnelConfig {
  client?: Client;
  host?: string;
  port?: number;
  server?: Server;
}

// DEFER(jason4012) Rename back to CreateConnection once we've migrated all of the plugins off DatabasePlugin/DatabasePluginPooled
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function CreateConnectionSQL(target: SQLDatabasePlugin, name: string, descriptor: PropertyDescriptor) {
  const fn = descriptor.value;
  descriptor.value = async function (...args) {
    return (this.tracer as Tracer).startActiveSpan(
      'databasePlugin.createConnection',
      {
        attributes: this.getTraceTags(),
        kind: SpanKind.SERVER
      },
      async (span) => {
        try {
          const result = await fn?.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.recordException(err);
          throw new IntegrationError(`failed to create ${this.name()} connection: ${err}`, ErrorCode.INTEGRATION_AUTHORIZATION);
        } finally {
          span.end();
        }
      }
    );
  };
  return descriptor;
}

// DEFER(jason4012) Rename back to DestroyConnection once we've migrated all of the plugins off DatabasePlugin/DatabasePluginPooled
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function DestroyConnectionSQL(
  target: SQLDatabasePlugin,
  name: string,
  descriptor: TypedPropertyDescriptor<(connection: unknown) => Promise<void>>
) {
  const fn = descriptor.value;
  descriptor.value = function (...args) {
    return (this.tracer as Tracer).startActiveSpan(
      'databasePlugin.destroyConnection',
      {
        attributes: this.getTraceTags(),
        kind: SpanKind.SERVER
      },
      async (span) => {
        try {
          const result = await fn?.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.recordException(err);
          this.logger.warn(`failed to destroy ${this.name()} connection: ${err}`);
        } finally {
          span.end();
        }
      }
    );
  };
  return descriptor;
}

// Wrapper class for tracing db plugins
export abstract class SQLDatabasePlugin extends BasePlugin {
  protected readonly parameterType: '$' | '?' | '@' | ':' | '{{';
  protected readonly columnEscapeCharacter: string = `"`;
  // Some DBs like MariaDB use ANALYZE TABLE statements
  protected readonly tableAnalyzePrefix: string = `ANALYZE`;
  // Most DBs use "UPDATE table1 SET ... FROM table2"
  // but MariaDB & MySQL use "UPDATE table1, table2" instead
  protected readonly useSqlUpdateFromStatement: boolean = true;
  // SQL query that returns Array<{ column_name: string; data_type: string }>
  protected readonly sqlSingleTableMetadata: string;
  // SQL query map
  // eslint-disable-next-line @typescript-eslint/ban-types
  protected readonly sqlQueryMap: Object;
  // For MsSQL, which wraps the whole connection in a transaction
  protected readonly skipTransaction: boolean;
  // For databases that are case-insensitive by default but have special characters to make names case-sensitive
  protected readonly caseSensitivityWrapCharacter: string | null = null;
  // Some SQL databases don't allow semicolon to end statements, others require them
  protected readonly trailingSemicolon: boolean = true;

  @ResolveActionConfigurationProperty
  public async resolveActionConfigurationProperty({
    context,
    actionConfiguration,
    files,
    property,
    escapeStrings
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ActionConfigurationResolutionContext): Promise<ResolvedActionConfigurationProperty> {
    return this._resolveActionConfigurationProperty({
      context,
      actionConfiguration,
      files,
      property,
      escapeStrings
    });
  }

  public async createTunnel(datasourceConfig: PostgresDatasourceConfiguration): Promise<SSHTunnelConfig | null> {
    if (!datasourceConfig.tunnel || !datasourceConfig.tunnel.enabled || isEmpty(datasourceConfig.tunnel)) {
      return null;
    }

    const tunnelConfig = datasourceConfig.tunnel;

    const tunnelInfo = await this._connectTunnel(
      tunnelConfig as SSHAuthConfiguration,
      datasourceConfig.endpoint as { host: string; port: number },
      this.secretStore
    );
    const host = '127.0.0.1';
    const addr = tunnelInfo[0].address();
    let port;
    try {
      if (typeof addr === 'string') {
        port = parseInt(addr, 10);
      } else {
        port = (addr as AddressInfo).port;
      }

      // port is either NaN or not assigned (unassigned variable === null resolves to true)
      if (isNaN(port) || port === null) {
        throw new IntegrationError('Invalid port number', ErrorCode.INTEGRATION_NETWORK);
      }
    } catch (e) {
      if (e instanceof IntegrationError) {
        throw e;
      }
      throw new IntegrationError(`${this.name()} connection failed: unable to bind port locally`, ErrorCode.INTEGRATION_NETWORK);
    }

    return {
      host,
      port
    } as SSHTunnelConfig;
  }

  /**
   * Wraps Queries for tracing
   * @param queryFunc code to trace
   * @param additionalTraceTags any additional tags for the span
   * @returns anything returned by queryFunc
   */
  public executeQuery<T>(queryFunc: () => Promise<T>, additionalTraceTags: Record<string, string> = {}): Promise<T> {
    return this.tracer.startActiveSpan(
      'databasePlugin.executeQuery',
      {
        attributes: {
          ...this.getTraceTags(),
          ...additionalTraceTags
        },
        kind: SpanKind.SERVER
      },
      async (span) => {
        try {
          const result = await queryFunc();
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          span.setStatus({ code: SpanStatusCode.ERROR });
          span.recordException(err);
          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  private async _connectTunnel(
    sshTunnelConfig: SSHAuthConfiguration,
    connectionConfig: { host: string; port: number },
    secretStore: SecretsConfiguration,
    autoClose = true
  ) {
    let tunnelConfig;
    if (sshTunnelConfig.authMethod === undefined) {
      throw new IntegrationError('No auth method specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (sshTunnelConfig.authMethod) {
      switch (sshTunnelConfig.authMethod as SharedSSHAuthMethod) {
        case SharedSSHAuthMethod.PASSWORD:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            password: sshTunnelConfig.password
          };
          break;
        case SharedSSHAuthMethod.PUB_KEY_ED25519:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            privateKey: getKeyFromSSHAuthMethod(secretStore, sshTunnelConfig),
            passphrase: sshTunnelConfig.passphrase
          };
          break;
        case SharedSSHAuthMethod.PUB_KEY_RSA:
        default:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            privateKey: getKeyFromSSHAuthMethod(secretStore, sshTunnelConfig),
            passphrase: sshTunnelConfig.passphrase
          };
      }
    } else {
      // using protobuf
      switch (sshTunnelConfig.authenticationMethod as PluginCommon.SSHAuthMethod) {
        case PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PASSWORD:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            password: sshTunnelConfig.password
          };
          break;
        case PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_ED25519:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            privateKey: getKeyFromSSHAuthMethod(secretStore, sshTunnelConfig),
            passphrase: sshTunnelConfig.passphrase
          };
          break;
        case PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_PUB_KEY_RSA:
        default:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            privateKey: getKeyFromSSHAuthMethod(secretStore, sshTunnelConfig),
            passphrase: sshTunnelConfig.passphrase
          };
      }
    }

    const tunnelOptions = {
      // This closes the Tunnel-Server once all clients disconnect from the server.
      // We default to false so that the locally bound port is freed up when the SSH connection is closed
      autoClose: autoClose
    };

    const serverOptions = {
      // Let the host choose a free port locally.
      port: 0
    };

    const forwardOptions = {
      // Omit srcAddr and srcPort to let the OS decide.
      dstAddr: connectionConfig.host, // database host
      dstPort: connectionConfig.port
    };

    const tunnelSsh = await import('tunnel-ssh');

    return tunnelSsh.createTunnel(tunnelOptions, serverOptions, tunnelConfig, forwardOptions);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getValueFromPath(obj: any, path: string) {
    let current = obj;
    for (const key of path.split('.')) {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  private _shouldNotUseParameterizedSql(resolutionContext: ActionConfigurationResolutionContext): boolean {
    // as we transition SQL plugins from older models to new proto models, we need to support both ways.
    // this custom logic can live here
    if ('usePreparedSql' in resolutionContext.actionConfiguration) {
      return !resolutionContext.actionConfiguration.usePreparedSql;
    } else if (
      'runSql' in resolutionContext.actionConfiguration &&
      resolutionContext.actionConfiguration.runSql &&
      'useParameterized' in resolutionContext.actionConfiguration.runSql
    ) {
      return !resolutionContext.actionConfiguration.runSql?.useParameterized;
    }

    return false;
  }

  private async _resolveActionConfigurationProperty(
    resolutionContext: ActionConfigurationResolutionContext
  ): Promise<ResolvedActionConfigurationProperty> {
    if (
      ('operation' in resolutionContext.actionConfiguration &&
        resolutionContext.actionConfiguration.operation === SqlOperations.UPDATE_ROWS) ||
      this._shouldNotUseParameterizedSql(resolutionContext) ||
      !['body', 'runSql.sqlBody'].includes(resolutionContext.property)
    ) {
      return super.resolveActionConfigurationProperty({
        context: resolutionContext.context,
        actionConfiguration: resolutionContext.actionConfiguration,
        files: resolutionContext.files,
        property: resolutionContext.property,
        escapeStrings: resolutionContext.escapeStrings
      });
    }
    const propertyToResolve = this._getValueFromPath(resolutionContext.actionConfiguration, resolutionContext.property) ?? '';
    const bindingResolution: Record<string, string> = {};
    const bindingResolutions = await resolveAllBindings(
      propertyToResolve,
      resolutionContext.context,
      resolutionContext.files ?? {},
      resolutionContext.escapeStrings
    );
    resolutionContext.context.preparedStatementContext = [];
    let bindingCount = 1;
    for (const toEval of extractMustacheStrings(propertyToResolve)) {
      if (['{{', '$', ':'].includes(this.parameterType ?? '')) {
        // if this binding has been handled already, keep the value assigned to it the first time
        if (!Object.prototype.hasOwnProperty.call(bindingResolution, toEval)) {
          // TODO: Include MSSQL
          bindingResolution[toEval] = this.parameterType === '{{' ? `{{PARAM_${bindingCount++}}}` : `${this.parameterType}${bindingCount++}`;
          resolutionContext.context.preparedStatementContext.push(bindingResolutions[toEval]);
        }
      } else {
        // The '?' syntax for bindings/parameters doesn't differentiate between different instances of the same
        // binding, so we need to add the value to the prepared statement context list every time we encounter it.
        bindingResolution[toEval] = '?';
        resolutionContext.context.preparedStatementContext.push(bindingResolutions[toEval]);
      }
    }
    const { renderedStr: resolved, bindingLocations } = renderValueWithLoc(propertyToResolve, bindingResolution);
    const placeholdersInfo: PlaceholdersInfo = {};
    for (const [bindingName, bindingValue] of Object.entries(bindingResolutions)) {
      const bindingNumeric = bindingResolution[bindingName];
      const locations = bindingLocations[bindingName];
      if (bindingNumeric !== undefined && locations !== undefined) {
        placeholdersInfo[bindingNumeric] = {
          locations,
          value: showBoundValue(bindingValue)
        };
      }
    }
    return { resolved, placeholdersInfo };
  }
}
