import { AddressInfo, Server } from 'net';
import { SpanKind, SpanStatusCode, Tracer } from '@opentelemetry/api';
import { isEmpty, isEqual, isNull, isObject, isPlainObject, isUndefined } from 'lodash';
import { Client } from 'ssh2';
import { ErrorCode, IntegrationError } from '../../errors';
import {
  DBActionConfiguration,
  DBSQLActionConfiguration,
  DBTunnelDatasourceConfiguration,
  ExecutionOutput,
  PlaceholdersInfo,
  PluginCommon,
  PostgresActionConfiguration,
  ResolvedActionConfigurationProperty,
  SSHAuthConfiguration,
  SecretsConfiguration,
  SharedSSHAuthMethod
} from '../../types';
import { ActionConfigurationResolutionContext, showBoundValue } from '../../utils';
import { extractMustacheStrings, renderValueWithLoc, resolveAllBindings } from '../execution';
import { SQLMappingModeEnum, SqlOperations } from '../templates';
import { BasePlugin, ResolveActionConfigurationProperty, getKeyFromSSHAuthMethod } from './BasePlugin';

export interface SSHTunnelConfig {
  client?: Client;
  host?: string;
  port?: number;
  server?: Server;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function CreateConnection(target: DatabasePlugin, name: string, descriptor: PropertyDescriptor) {
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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function DestroyConnection(
  target: DatabasePlugin,
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
export abstract class DatabasePlugin extends BasePlugin {
  protected readonly parameterType: '$' | '?' | '@' | ':' | ':PARAM';
  protected readonly columnEscapeCharacter: string = `"`;
  // Some DBs like MariaDB use ANALYZE TABLE statements
  protected readonly tableAnalyzePrefix: string = `ANALYZE`;
  // Most DBs use "UPDATE table1 SET ... FROM table2"
  // but MariaDB & MySQL use "UPDATE table1, table2" instead
  protected readonly useSqlUpdateFromStatement: boolean = true;
  // SQL query that returns Array<{ column_name: string; data_type: string }>
  protected readonly sqlSingleTableMetadata: string;
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

  public async createTunnel(datasourceConfig: DBTunnelDatasourceConfiguration): Promise<SSHTunnelConfig | null> {
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

          // throw the error as it'll get caught downstream by plugin-specific logic
          throw err;
          // throw new IntegrationError(`${this.name()} query failed to execute: ${err.message}`);
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
    if (sshTunnelConfig.authMethod === undefined && sshTunnelConfig.authenticationMethod === undefined) {
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
        case SharedSSHAuthMethod.USER_PRIVATE_KEY:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            privateKey: sshTunnelConfig.privateKey,
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
        case PluginCommon.SSHAuthMethod.SSH_AUTH_METHOD_USER_PRIVATE_KEY:
          tunnelConfig = {
            host: sshTunnelConfig.host,
            port: sshTunnelConfig.port,
            username: sshTunnelConfig.username,
            privateKey: sshTunnelConfig.privateKey,
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
      if ([':PARAM', '$', ':'].includes(this.parameterType)) {
        // if this binding has been handled already, keep the value assigned to it the first time
        if (!Object.prototype.hasOwnProperty.call(bindingResolution, toEval)) {
          // TODO: Include MSSQL
          bindingResolution[toEval] = this.parameterType === ':PARAM' ? `:PARAM_${bindingCount++}` : `${this.parameterType}${bindingCount++}`;
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

  protected async _executeUpdateRowsPrimary(
    {
      mutableOutput,
      actionConfiguration,
      primaryKeyQuery,
      onlyTableInPrimaryKeyQuery,
      separateSchemaAndTableInPrimaryKeyQuery,
      capitalizeSchemaOrTable
    }: {
      mutableOutput: ExecutionOutput;
      actionConfiguration: PostgresActionConfiguration;
      primaryKeyQuery: string;
      onlyTableInPrimaryKeyQuery?: boolean;
      separateSchemaAndTableInPrimaryKeyQuery?: boolean;
      capitalizeSchemaOrTable?: boolean;
    },
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseActionConfiguration(actionConfiguration);
    if (isEmpty(updatedRows) && isEmpty(deletedRows) && isEmpty(insertedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }
    let mappedColumns = actionConfiguration.mappedColumns ?? [];
    if (actionConfiguration.mappingMode === 'manual' && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.mappingMode !== 'manual') {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    try {
      let escapedTable = this.wrapForCaseIfNeeded(actionConfiguration.table ?? '');
      escapedTable = capitalizeSchemaOrTable ? (actionConfiguration.table ?? '').toUpperCase() : escapedTable;
      let escapedSchema = this.wrapForCaseIfNeeded(actionConfiguration.schema ?? '');
      escapedSchema = capitalizeSchemaOrTable ? (actionConfiguration.schema ?? '').toUpperCase() : escapedSchema;
      const primaryColumns: Array<{ column_name: string; data_type: string }> = await this.executeQuery(async () => {
        const query = primaryKeyQuery;
        let params = [`${escapedSchema}.${escapedTable}`];
        if (onlyTableInPrimaryKeyQuery) {
          params = [escapedTable];
        } else if (separateSchemaAndTableInPrimaryKeyQuery) {
          params = [escapedSchema, escapedTable];
        }
        mutableOutput.logInfo(`${query} - params ${JSON.stringify(params)}`);
        const { time, result } = await measureQueryTime(() => {
          return queryFn(query, params);
        });
        mutableOutput.logInfo(`Took ${time}ms`);
        return result;
      });
      if (!primaryColumns.length) {
        throw new IntegrationError(`Table ${escapedSchema}.${escapedTable} has no primary keys`, ErrorCode.INTEGRATION_LOGIC);
      }

      const allColumns: Array<{ column_name: string; data_type: string }> = await this.executeQuery(async () => {
        const params = [actionConfiguration.schema ?? '', actionConfiguration.table ?? ''];
        params[0] = capitalizeSchemaOrTable && params[0] ? params[0].toUpperCase() : params[0];
        params[1] = capitalizeSchemaOrTable && params[1] ? params[1].toUpperCase() : params[1];
        mutableOutput.logInfo(`${this.sqlSingleTableMetadata} - params ${JSON.stringify(params)}`);
        const { time, result } = await measureQueryTime(() => {
          return queryFn(this.sqlSingleTableMetadata, params);
        });
        mutableOutput.logInfo(`Took ${time}ms`);
        return result;
      });
      if (!allColumns.length) {
        throw new IntegrationError(
          `Could not find column schema for ${actionConfiguration.schema}.${actionConfiguration.table}`,
          ErrorCode.INTEGRATION_LOGIC
        );
      }

      await this._runUpdateTransaction({
        queryFn,
        schema: actionConfiguration.schema as string,
        table: actionConfiguration.table as string,
        oldRows: updatedRows,
        insertedRows: insertedRows,
        updatedRows: updatedRows,
        deletedRows: deletedRows,
        filterBy: primaryColumns.map((row) => row.column_name),
        tableColumns: allColumns,
        isManualMapping: actionConfiguration.mappingMode === 'manual',
        isPrimaryKeyMode: true,
        mappedColumns: mappedColumns,
        mutableOutput,
        capitalizeSchemaOrTable
      });
    } catch (e) {
      throw new IntegrationError(e.message, ErrorCode.UNSPECIFIED, { stack: e.stack });
    }

    mutableOutput.output = null;
  }

  protected async _executeUpdateRowsByCols(
    {
      mutableOutput,
      actionConfiguration,
      capitalizeSchemaOrTable
    }: {
      mutableOutput: ExecutionOutput;
      actionConfiguration: PostgresActionConfiguration;
      capitalizeSchemaOrTable?: boolean;
    },
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const oldRows = this._validateAndParseRowValues(actionConfiguration.oldValues, 'Rows to Filter by');
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseActionConfiguration(actionConfiguration);
    let filterBy = actionConfiguration.filterBy;
    if (typeof filterBy === 'string') {
      // This one shouldn't happen in practice because the form is structured
      try {
        filterBy = JSON.parse(filterBy);
      } catch (e) {
        throw new IntegrationError(
          `Validation failed, list of columns to filter must be valid JSON. Bindings {{}} are recommended.`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }
    }
    if (!Array.isArray(filterBy) || !filterBy.length || filterBy.some((col) => typeof col !== 'string')) {
      throw new IntegrationError(`Query failed, no columns to filter by`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (oldRows.length !== updatedRows.length) {
      throw new IntegrationError(`Mismatched length on filter rows and new rows`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    let mappedColumns = actionConfiguration.mappedColumns ?? [];
    if (actionConfiguration.mappingMode === 'manual' && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.mappingMode !== 'manual') {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    mutableOutput.logInfo('Fetching table columns');
    const allColumns: Array<{ column_name: string; data_type: string }> = await this.executeQuery(() => {
      const params = [actionConfiguration.schema, actionConfiguration.table];
      params[0] = capitalizeSchemaOrTable && params[0] ? params[0].toUpperCase() : params[0];
      params[1] = capitalizeSchemaOrTable && params[1] ? params[1].toUpperCase() : params[1];
      mutableOutput.logInfo(`${this.sqlSingleTableMetadata} - params ${JSON.stringify(params)}`);
      return queryFn(this.sqlSingleTableMetadata, params) as Promise<Array<{ column_name: string; data_type: string }>>;
    });

    const allColumnNames = allColumns.map((c) => c.column_name);
    filterBy.forEach((col) => {
      if (!allColumnNames.includes(col)) {
        throw new IntegrationError(
          `Can't filter using column ${col}, that column name is missing in table ${actionConfiguration.table}`,
          ErrorCode.INTEGRATION_SYNTAX
        );
      }
    });

    if (isEmpty(insertedRows) && isEmpty(updatedRows) && isEmpty(deletedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }

    await this._runUpdateTransaction({
      queryFn,
      schema: actionConfiguration.schema as string,
      table: actionConfiguration.table as string,
      oldRows: oldRows,
      insertedRows: insertedRows,
      updatedRows: updatedRows,
      deletedRows: deletedRows,
      filterBy: filterBy as string[],
      tableColumns: allColumns,
      isManualMapping: actionConfiguration.mappingMode === 'manual',
      isPrimaryKeyMode: false,
      mappedColumns: mappedColumns,
      mutableOutput,
      capitalizeSchemaOrTable
    });
    mutableOutput.output = null;
  }

  protected async _executeSQLUpdateRowsPrimary(
    {
      mutableOutput,
      actionConfiguration,
      primaryKeyQuery,
      onlyTableInPrimaryKeyQuery,
      separateSchemaAndTableInPrimaryKeyQuery,
      capitalizeSchemaOrTable
    }: {
      mutableOutput: ExecutionOutput;
      actionConfiguration: DBSQLActionConfiguration;
      primaryKeyQuery: string;
      onlyTableInPrimaryKeyQuery?: boolean;
      separateSchemaAndTableInPrimaryKeyQuery?: boolean;
      capitalizeSchemaOrTable?: boolean;
    },
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>,
    queryFnMany?: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.bulkEdit?.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseSQLActionConfiguration(actionConfiguration);
    if (isEmpty(updatedRows) && isEmpty(deletedRows) && isEmpty(insertedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }
    let mappedColumns = actionConfiguration.bulkEdit?.mappedColumns ?? [];
    if (actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.bulkEdit?.mappingMode !== SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL) {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    try {
      let escapedTable = this.wrapForCaseIfNeeded(actionConfiguration.bulkEdit?.table ?? '');
      escapedTable = capitalizeSchemaOrTable ? (actionConfiguration.bulkEdit?.table ?? '').toUpperCase() : escapedTable;
      let escapedSchema = this.wrapForCaseIfNeeded(actionConfiguration.bulkEdit?.schema ?? '');
      escapedSchema = capitalizeSchemaOrTable ? (actionConfiguration.bulkEdit?.schema ?? '').toUpperCase() : escapedSchema;
      const primaryColumns: Array<{ column_name: string; data_type: string }> = await this.executeQuery(async () => {
        const query = primaryKeyQuery;
        let params = [`${escapedSchema}.${escapedTable}`];
        if (onlyTableInPrimaryKeyQuery) {
          params = [escapedTable];
        } else if (separateSchemaAndTableInPrimaryKeyQuery) {
          params = [escapedSchema, escapedTable];
        }
        mutableOutput.logInfo(`${query} - params ${JSON.stringify(params)}`);
        const { time, result } = await measureQueryTime(() => {
          return queryFn(query, params);
        });
        mutableOutput.logInfo(`Took ${time}ms`);
        return result;
      });
      if (!primaryColumns.length) {
        throw new IntegrationError(`Table ${escapedSchema}.${escapedTable} has no primary keys`, ErrorCode.INTEGRATION_LOGIC);
      }

      const allColumns: Array<{ column_name: string; data_type: string }> = await this.executeQuery(async () => {
        const params = [actionConfiguration.bulkEdit?.schema ?? '', actionConfiguration.bulkEdit?.table ?? ''];
        params[0] = capitalizeSchemaOrTable ? params[0].toUpperCase() : params[0];
        params[1] = capitalizeSchemaOrTable ? params[1].toUpperCase() : params[1];
        mutableOutput.logInfo(`${this.sqlSingleTableMetadata} - params ${JSON.stringify(params)}`);
        const { time, result } = await measureQueryTime(() => {
          return queryFn(this.sqlSingleTableMetadata, params);
        });
        mutableOutput.logInfo(`Took ${time}ms`);
        return result;
      });
      if (!allColumns.length) {
        throw new IntegrationError(
          `Could not find column schema for ${actionConfiguration.bulkEdit?.schema}.${actionConfiguration.bulkEdit?.table}`,
          ErrorCode.INTEGRATION_LOGIC
        );
      }

      await this._runUpdateTransaction({
        queryFn,
        queryFnMany,
        schema: actionConfiguration.bulkEdit?.schema as string,
        table: actionConfiguration.bulkEdit?.table as string,
        oldRows: updatedRows,
        insertedRows: insertedRows,
        updatedRows: updatedRows,
        deletedRows: deletedRows,
        filterBy: primaryColumns.map((row) => row.column_name),
        tableColumns: allColumns,
        isManualMapping: actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL,
        isPrimaryKeyMode: true,
        mappedColumns: mappedColumns,
        mutableOutput,
        capitalizeSchemaOrTable
      });
    } catch (e) {
      throw new IntegrationError(e.message, ErrorCode.UNSPECIFIED, { stack: e.stack });
    }

    mutableOutput.output = null;
  }

  protected async _executeSQLUpdateRowsByCols(
    {
      mutableOutput,
      actionConfiguration,
      capitalizeSchemaOrTable
    }: {
      mutableOutput: ExecutionOutput;
      actionConfiguration: DBSQLActionConfiguration;
      capitalizeSchemaOrTable?: boolean;
    },
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>,
    queryFnMany?: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>
  ): Promise<void> {
    if (isEmpty(actionConfiguration.bulkEdit?.table)) {
      throw new IntegrationError(`Query failed, table was empty`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    // will throw exception if not valid values or if user did not define inserted/updated/deleted rows in UI
    const oldRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.oldRows, 'Rows to Filter by');
    const { insertedRows, deletedRows, updatedRows } = this._validateAndParseSQLActionConfiguration(actionConfiguration);
    let filterBy = actionConfiguration.bulkEdit?.filterBy;
    if (typeof filterBy === 'string') {
      // This one shouldn't happen in practice because the form is structured
      try {
        filterBy = JSON.parse(filterBy);
      } catch (e) {
        throw new IntegrationError(
          `Validation failed, list of columns to filter must be valid JSON. Bindings {{}} are recommended.`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }
    }
    if (!Array.isArray(filterBy) || !filterBy.length || filterBy.some((col) => typeof col !== 'string')) {
      throw new IntegrationError(`Query failed, no columns to filter by`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (oldRows.length !== updatedRows.length) {
      throw new IntegrationError(`Mismatched length on filter rows and new rows`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    let mappedColumns = actionConfiguration.bulkEdit?.mappedColumns ?? [];
    if (actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL && !Array.isArray(mappedColumns)) {
      throw new IntegrationError(`Query failed, manual mappings are not defined`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (actionConfiguration.bulkEdit?.mappingMode !== SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL) {
      // Ignore any mappedColumns if the UI is in auto mode
      mappedColumns = [];
    }

    mutableOutput.logInfo('Fetching table columns');
    const allColumns: Array<{ column_name: string; data_type: string }> = await this.executeQuery(() => {
      const params = [actionConfiguration.bulkEdit?.schema, actionConfiguration.bulkEdit?.table];
      params[0] = capitalizeSchemaOrTable && params[0] ? params[0].toUpperCase() : params[0];
      params[1] = capitalizeSchemaOrTable && params[1] ? params[1].toUpperCase() : params[1];
      mutableOutput.logInfo(`${this.sqlSingleTableMetadata} - params ${JSON.stringify(params)}`);
      return queryFn(this.sqlSingleTableMetadata, params) as Promise<Array<{ column_name: string; data_type: string }>>;
    });

    const allColumnNames = allColumns.map((c) => c.column_name);
    filterBy.forEach((col) => {
      if (!allColumnNames.includes(col)) {
        throw new IntegrationError(
          `Can't filter using column ${col}, that column name is missing in table ${actionConfiguration.bulkEdit?.table}`,
          ErrorCode.INTEGRATION_SYNTAX
        );
      }
    });

    if (isEmpty(insertedRows) && isEmpty(updatedRows) && isEmpty(deletedRows)) {
      // Nothing to update, this is not a failure
      mutableOutput.output = null;
      return;
    }

    await this._runUpdateTransaction({
      queryFn,
      queryFnMany,
      schema: actionConfiguration.bulkEdit?.schema as string,
      table: actionConfiguration.bulkEdit?.table as string,
      oldRows: oldRows,
      insertedRows: insertedRows,
      updatedRows: updatedRows,
      deletedRows: deletedRows,
      filterBy: filterBy as string[],
      tableColumns: allColumns,
      isManualMapping: actionConfiguration.bulkEdit?.mappingMode === SQLMappingModeEnum.SQL_MAPPING_MODE_MANUAL,
      isPrimaryKeyMode: false,
      mappedColumns: mappedColumns,
      mutableOutput,
      capitalizeSchemaOrTable
    });
    mutableOutput.output = null;
  }

  // DEFER(jason4012) remove the legacy path by migrating all SQL DB plugins to use the bulkEdit format
  private _validateAndParseActionConfiguration(actionConfiguration: DBActionConfiguration): {
    insertedRows: Array<Record<string, unknown>>;
    updatedRows: Array<Record<string, unknown>>;
    deletedRows: Array<Record<string, unknown>>;
  } {
    let notGivenCount = 0;
    const allInitialValues = {
      insertedRows: [] as Array<Record<string, unknown>>,
      updatedRows: [] as Array<Record<string, unknown>>,
      deletedRows: [] as Array<Record<string, unknown>>
    };

    try {
      allInitialValues.insertedRows = this._validateAndParseRowValues(actionConfiguration.insertedRows, 'Inserted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.updatedRows = this._validateAndParseRowValues(actionConfiguration.newValues, 'Updated Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.deletedRows = this._validateAndParseRowValues(actionConfiguration.deletedRows, 'Deleted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    if (notGivenCount === 3) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
    return allInitialValues;
  }

  private _validateAndParseSQLActionConfiguration(actionConfiguration: DBSQLActionConfiguration): {
    insertedRows: Array<Record<string, unknown>>;
    updatedRows: Array<Record<string, unknown>>;
    deletedRows: Array<Record<string, unknown>>;
  } {
    let notGivenCount = 0;
    const allInitialValues = {
      insertedRows: [] as Array<Record<string, unknown>>,
      updatedRows: [] as Array<Record<string, unknown>>,
      deletedRows: [] as Array<Record<string, unknown>>
    };

    try {
      allInitialValues.insertedRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.insertedRows, 'Inserted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.updatedRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.updatedRows, 'Updated Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    try {
      allInitialValues.deletedRows = this._validateAndParseRowValues(actionConfiguration.bulkEdit?.deletedRows, 'Deleted Rows');
    } catch (e) {
      if (e instanceof TypeError) {
        notGivenCount++;
      } else {
        throw e;
      }
    }
    if (notGivenCount === 3) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
    return allInitialValues;
  }

  private _validateAndParseRowValues(values, description: string): Array<Record<string, unknown>> {
    // description is something like 'Inserted Rows', 'Updated Rows', 'Deleted Rows'
    if (values === undefined) {
      throw new TypeError(`${description} was not given.`);
    }
    let validatedValues = values;
    if (typeof values === 'string') {
      if (values.trim() === '') {
        validatedValues = [];
      } else {
        try {
          validatedValues = JSON.parse(values);
        } catch (e) {
          throw new IntegrationError(
            `Validation failed, list of ${description} must be valid JSON. Given '${JSON.stringify(
              values
            )}'. Bindings {{}} are recommended.`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
          );
        }
      }
    }
    if (!Array.isArray(validatedValues) || validatedValues === null) {
      throw new IntegrationError(
        `Validation failed, ${description} is not an array. Given '${JSON.stringify(values)}'`,
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
    // check that everything in validated values is an object and not an empty object {}
    for (const row of validatedValues) {
      if (typeof row !== 'object' || Array.isArray(row)) {
        throw new IntegrationError(
          `Validation failed, ${description} has a row that is not a plain object: '${String(row)}'`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      } else if (Object.keys(row).length === 0) {
        throw new IntegrationError(
          `Validation failed, ${description} must not contain any empty rows. Given '${JSON.stringify(values)}'`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }
    }
    return validatedValues;
  }

  protected async _runUpdateTransaction({
    queryFn,
    queryFnMany,
    schema,
    table,
    oldRows,
    insertedRows,
    updatedRows,
    deletedRows,
    filterBy,
    tableColumns,
    mutableOutput,
    isManualMapping,
    isPrimaryKeyMode,
    mappedColumns,
    capitalizeSchemaOrTable
  }: {
    queryFn: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    queryFnMany?: (query: string, args?: unknown[]) => Promise<Array<Record<string, unknown>>>;
    table: string;
    schema: string;
    oldRows: unknown[];
    insertedRows: Array<Record<string, unknown>>;
    updatedRows: Array<Record<string, unknown>>;
    deletedRows: Array<Record<string, unknown>>;
    filterBy: string[];
    tableColumns: Array<{ column_name: string; data_type: string }>;
    isManualMapping: boolean;
    isPrimaryKeyMode: boolean;
    mappedColumns: Exclude<PostgresActionConfiguration['mappedColumns'], undefined>;
    mutableOutput: ExecutionOutput;
    capitalizeSchemaOrTable?: boolean;
  }): Promise<void> {
    const branches: string[] = [];
    const parameters: unknown[] = [];
    const placeholder = this.parameterType === '@' ? '@PARAM_' : ['$', ':'].includes(this.parameterType) ? this.parameterType : '?';
    const includeIndex = ['@PARAM_', '$', ':'].includes(placeholder);
    mutableOutput.logInfo('Validating columns for filtering');
    const validColumnNames = new Set(tableColumns.map((m) => m.column_name));
    if (isManualMapping) {
      mutableOutput.logInfo('Validating manual column mappings');
      mappedColumns.forEach((col) => {
        if (!validColumnNames.has(col.sql)) {
          throw new IntegrationError(
            `Manual mapping failed because ${col.sql} is not a valid column in ${this.escapeAsCol(table)}`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
          );
        }
      });
    }

    const schemaAndTable = `${this.escapeAsCol(capitalizeSchemaOrTable ? schema.toUpperCase() : schema)}.${this.escapeAsCol(
      capitalizeSchemaOrTable ? table.toUpperCase() : table
    )}`;

    const lookupColumnName = isManualMapping
      ? Object.fromEntries(
          mappedColumns.map((col) => {
            return [col.json, col.sql];
          })
        )
      : Object.fromEntries(tableColumns.map((col) => [col.column_name, col.column_name]));

    const lookupJsonKey = isManualMapping
      ? Object.fromEntries(
          mappedColumns.map((col) => {
            return [col.sql, col.json];
          })
        )
      : Object.fromEntries(tableColumns.map((col) => [col.column_name, col.column_name]));

    const previouslySeenFilters: Array<Array<unknown>> = [];
    oldRows.forEach((row) => {
      if (!isObject(row) || !isPlainObject(row)) {
        throw new IntegrationError(`One of the rows in the filter rows is not a plain object: ${String(row)}`, ErrorCode.INTEGRATION_LOGIC);
      }
      if (!isManualMapping) {
        Object.keys(row).forEach((k) => {
          if (!validColumnNames.has(lookupColumnName[k])) {
            throw new IntegrationError(`Column "${k}" doesn't exist in table ${schemaAndTable}`, ErrorCode.INTEGRATION_SYNTAX);
          }
        });
      }
      const filterValues: unknown[] = [];
      filterBy.forEach((col) => {
        const jsonKey = lookupJsonKey[col];
        if (isUndefined(jsonKey)) {
          throw new IntegrationError(`Can't filter by "${col}" because it's missing in the column mapping`, ErrorCode.INTEGRATION_SYNTAX);
        }
        const val = row[jsonKey];
        if (isUndefined(val)) {
          throw new IntegrationError(
            `Missing ${isPrimaryKeyMode ? 'primary key column' : 'filter column'} "${
              isManualMapping ? lookupJsonKey[col] : col
            }" in row: ${JSON.stringify(row)}`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        if (isNull(val)) {
          throw new IntegrationError(
            `Null is not allowed in ${isPrimaryKeyMode ? 'primary key column' : 'filter column'} "${
              isManualMapping ? lookupJsonKey[col] : col
            }" in row: ${JSON.stringify(row)}`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        filterValues.push(val);
      });
      if (previouslySeenFilters.find((f) => isEqual(f, filterValues))) {
        throw new IntegrationError(`Some rows are duplicates, found ${JSON.stringify(filterValues)}`, ErrorCode.INTEGRATION_LOGIC);
      } else {
        // Tracks duplicates
        previouslySeenFilters.push(filterValues);
      }
    });

    const insertQueriesAndParams: Array<Array<string | Array<unknown>>> = [];
    if (insertedRows.length > 0) {
      // remap the column names if this is a manually mapped table
      if (isManualMapping) {
        insertedRows = this._retrieveMappedRows(insertedRows, lookupColumnName);
      }

      // group the rows by the columns they contain
      const rowsByColumns: { [key: string]: unknown[] } = {};
      insertedRows.forEach((row) => {
        const columns = Object.keys(row);
        const columnsKey = columns.sort().join(',');
        if (!rowsByColumns[columnsKey]) {
          rowsByColumns[columnsKey] = [];
        }
        rowsByColumns[columnsKey].push(row);
      });

      if (queryFnMany) {
        // plugin has bulk transaction logic built in, use it to generate insert statements
        const columns = Array.from(validColumnNames);
        const insertQuery = `INSERT INTO ${schemaAndTable} VALUES (${columns
          .map((columnName) => `${placeholder}${columnName}`)
          .join(', ')})${this.trailingSemicolon ? ';' : ''}`;
        const params = insertedRows.map((insertedRow) =>
          Object.assign(
            columns.reduce(
              (acc: Record<string, unknown>, column: string) => {
                acc[column] = null;
                return acc;
              },
              {} as Record<string, unknown>
            ) as Record<string, unknown>,
            insertedRow
          )
        );
        insertQueriesAndParams.push([insertQuery, params]);
      } else {
        // create insert statements for each group of rows with the same columns
        for (const columnsKey in rowsByColumns) {
          const columns = columnsKey.split(',');
          const params: unknown[] = [];
          const insertQuery = `INSERT INTO ${schemaAndTable} (${columns.map(this.wrapForCaseIfNeeded.bind(this)).join(', ')})
            VALUES ${rowsByColumns[columnsKey]
              .map((row) => {
                const rowParams: Array<string> = [];
                const typedRow = row as Record<string, unknown>;
                for (const column of columns) {
                  if (typedRow[column] == null) {
                    params.push(null);
                  } else {
                    params.push(typedRow[column]);
                  }
                  rowParams.push(`${placeholder}${includeIndex ? params.length : ''}`);
                }
                return `(${rowParams.join(', ')})`;
              })
              .join(', ')}${this.trailingSemicolon ? ';' : ''}`;
          insertQueriesAndParams.push([insertQuery, params]);
        }
      }
    }

    const deleteQueriesAndParams: Array<Array<string | Array<unknown>>> = [];
    if (deletedRows.length > 0) {
      if (isManualMapping) {
        deletedRows = this._retrieveMappedRows(deletedRows, lookupColumnName);
      }
      const rowsByColumns: { [key: string]: unknown[] } = {};
      deletedRows.forEach((row) => {
        const columns = Object.keys(row);
        const columnsKey = JSON.stringify(columns.sort());
        if (!rowsByColumns[columnsKey]) {
          rowsByColumns[columnsKey] = [];
        }
        rowsByColumns[columnsKey].push(row);
      });

      for (const columnsKey in rowsByColumns) {
        const columns = JSON.parse(columnsKey);

        let paramIndex = 1;
        const selectParams: unknown[] = [];

        const countRowsForDeletionQuery = `SELECT COUNT(*) as ${this.escapeAsCol('count')} FROM ${schemaAndTable}
          WHERE ${rowsByColumns[columnsKey]
            .map((row) => {
              const rowParams: Array<string> = [];
              const typedRow = row as Record<string, unknown>;
              for (const column of columns) {
                const value = typedRow[column];
                if (value == null) {
                  rowParams.push(`${this.escapeAsCol(column)} IS NULL`);
                } else {
                  rowParams.push(`${this.escapeAsCol(column)} = ${placeholder}${includeIndex ? paramIndex++ : ''}`);
                  selectParams.push(value);
                }
              }
              return `(${rowParams.join(' AND ')})`;
            })
            .join(' OR ')}${this.trailingSemicolon ? ';' : ''}`;

        mutableOutput.logInfo('Validating deletion count');
        mutableOutput.logInfo(`${countRowsForDeletionQuery} - params ${JSON.stringify(selectParams)}`);
        const { time: updateTime, result } = await measureQueryTime(async () => await queryFn(countRowsForDeletionQuery, selectParams));

        mutableOutput.logInfo(`Took ${updateTime}ms`);
        // NOTE: There can still be edge cases where a row A matches no existing rows and row B
        // matches 2 existing rows instead of 1 and this criteria passes.
        // TODO: Use the temp table method for deletion to ensure we only delete the intended rows 100% of the time.
        let selectedCount;
        if (result[0].count != null) {
          selectedCount = result[0].count;
          selectedCount = typeof selectedCount === 'string' ? parseInt(selectedCount, 10) : (selectedCount as number);
        } else {
          throw new IntegrationError(`Unexpected result from count query: ${JSON.stringify(result)}`, ErrorCode.INTEGRATION_SYNTAX);
        }
        if (parseInt(selectedCount) > rowsByColumns[columnsKey].length) {
          throw new IntegrationError(
            `The number of rows given to delete (${deletedRows.length}) is less than the number of rows that would be deleted (${result[0].count}).`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        } else {
          mutableOutput.logInfo(`${selectedCount} existing rows match the delete query.`);
        }

        paramIndex = 1;
        const deleteParams: unknown[] = [];
        const deleteQuery = `DELETE FROM ${schemaAndTable}
          WHERE ${rowsByColumns[columnsKey]
            .map((row) => {
              const rowParams: Array<string> = [];
              const typedRow = row as Record<string, unknown>;
              for (const column of columns) {
                if (typedRow[column] == null) {
                  rowParams.push(`${this.escapeAsCol(column)} IS NULL`);
                } else {
                  rowParams.push(`${this.escapeAsCol(column)} = ${placeholder}${includeIndex ? paramIndex++ : ''}`);
                  deleteParams.push(typedRow[column]);
                }
              }
              return `(${rowParams.join(' AND ')})`;
            })
            .join(' OR ')}${this.trailingSemicolon ? ';' : ''}`;
        deleteQueriesAndParams.push([deleteQuery, deleteParams]);
      }
    }

    // only need temp table for updates
    if (updatedRows.length > 0) {
      // there are updates and possibly inserts and deletes
      mutableOutput.logInfo('Validating columns for updates');
      const potentiallyModifiedColumns = new Set<string>();
      let hasAnyPrimaryKeyDiffs = false;
      updatedRows.forEach((row, index) => {
        if (!isObject(row) || !isPlainObject(row)) {
          throw new IntegrationError(
            `One of the rows in the update rows is not a plain object: ${String(row)}`,
            ErrorCode.INTEGRATION_LOGIC
          );
        }
        if (isManualMapping) {
          mappedColumns.forEach((c) => {
            if (!isUndefined(row[c.json])) {
              potentiallyModifiedColumns.add(c.sql);
            }
          });
        } else {
          Object.keys(row).forEach((k) => {
            if (!validColumnNames.has(lookupColumnName[k])) {
              throw new IntegrationError(`Column "${k}" doesn't exist in table ${schemaAndTable}`, ErrorCode.INTEGRATION_SYNTAX);
            }
            potentiallyModifiedColumns.add(k);
          });
        }
        const oldRow = oldRows[index] as Record<string, unknown>;
        for (const primaryColumn of filterBy) {
          if (!isEqual(oldRow[lookupJsonKey[primaryColumn]], row[lookupJsonKey[primaryColumn]])) {
            hasAnyPrimaryKeyDiffs = true;
            break;
          }
        }
      });
      // If the user has modified any primary keys then we need to include the old ID & new ID,
      // otherwise we can include only one
      if (!hasAnyPrimaryKeyDiffs) {
        for (const primaryColumn of filterBy) {
          potentiallyModifiedColumns.delete(primaryColumn);
        }
      }

      if (!potentiallyModifiedColumns.size) {
        throw new IntegrationError(
          `Couldn't detect any columns to update in the list of new rows`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
        );
      }

      const tempName = this.getTempTableName();
      try {
        const indexedCols: string[] = [];
        let tableTypeString =
          filterBy
            .map((col) => {
              const match = tableColumns.find((m) => m.column_name === col);
              if (match) {
                indexedCols.push(this.escapeAsCol(col));
                return `${this.escapeAsCol(col)} ${match.data_type}`;
              }
              throw new IntegrationError(`Missing data type for column ${this.escapeAsCol(col)}`, ErrorCode.INTEGRATION_SYNTAX);
            })
            .join(',\n') + ',\n';

        const joinColumnMapping: Record<string, string> = {};

        const columnOrder = Array.from(potentiallyModifiedColumns);
        tableTypeString += columnOrder
          .map((col) => {
            const match = tableColumns.find((m) => m.column_name === col);
            if (match) {
              let uniqueName = col;
              if (hasAnyPrimaryKeyDiffs) {
                uniqueName += '2';
                // Continue appending the number 2 to our column name until it's not a duplicate
                while (validColumnNames.has(uniqueName) || Object.values(joinColumnMapping).includes(uniqueName)) {
                  uniqueName += '2';
                }
              }
              joinColumnMapping[col] = uniqueName;
              return `${this.escapeAsCol(uniqueName)} ${match.data_type}`;
            }
            throw new IntegrationError(`Missing data type for column ${this.escapeAsCol(col)}`, ErrorCode.INTEGRATION_SYNTAX);
          })
          .join(',\n');

        for (let i = 0; i < updatedRows.length; i++) {
          // Important: this is 1-indexed for SQL
          const oldRow = oldRows[i] as Record<string, unknown>;
          const newRow = updatedRows[i] as Record<string, unknown>;
          const indices = Array(filterBy.length + columnOrder.length)
            .fill('')
            .map((v, j) => {
              if (['@', '$', ':'].includes(this.parameterType)) {
                const index = i * (filterBy.length + columnOrder.length) + j + 1;
                if (this.parameterType === '@') {
                  return `@PARAM_${index}`;
                }
                return `${this.parameterType}${index}`;
              }
              return '?';
            });
          branches.push(`(${indices.join(', ')})`);
          filterBy.forEach((filterSql) => {
            parameters.push(oldRow[lookupJsonKey[filterSql]]);
          });
          columnOrder.forEach((columnSql) => {
            parameters.push(newRow[lookupJsonKey[columnSql]]);
          });
        }
        if (!this.skipTransaction) {
          mutableOutput.logInfo('Beginning transaction');
          await queryFn(`BEGIN`);
        }

        const createTable = `CREATE ${!['@', ':'].includes(this.parameterType) ? 'TEMPORARY TABLE' : 'TABLE'} ${tempName}
(
${tableTypeString}
)`;
        mutableOutput.logInfo(createTable);
        const measuredCreate = await measureQueryTime(async () => await queryFn(createTable));
        mutableOutput.logInfo(`Took ${measuredCreate.time}ms`);
        if (queryFnMany) {
          const columns = filterBy.concat(Array.from(potentiallyModifiedColumns));
          const insertQuery = `INSERT INTO ${tempName} VALUES (${columns.map((columnName) => `${placeholder}${columnName}`).join(', ')})`;
          const mappedUpdatedRows = this._retrieveMappedRows(updatedRows, lookupColumnName);
          const insertParams = mappedUpdatedRows.map((insertedRow) =>
            Object.assign(
              columns.reduce(
                (acc: Record<string, unknown>, column: string) => {
                  acc[column] = null;
                  return acc;
                },
                {} as Record<string, unknown>
              ) as Record<string, unknown>,
              insertedRow
            )
          );
          mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
          const { time: updateTime } = await measureQueryTime(
            async () => await queryFnMany(insertQuery as string, insertParams as Array<unknown>)
          );
          mutableOutput.logInfo(`Took ${updateTime}ms`);
        } else {
          const insertValues = `INSERT INTO ${tempName} VALUES ${branches.join(',\n')}`;
          mutableOutput.logInfo(`${insertValues} - params ${JSON.stringify(parameters)}`);
          const measuredInsert = await measureQueryTime(async () => await queryFn(insertValues, parameters));
          mutableOutput.logInfo(`Took ${measuredInsert.time}ms`);
        }

        const applyIndex =
          this.parameterType === '@'
            ? `CREATE INDEX ${tempName.substring(2)}_idx ON ${tempName} (${indexedCols.join(', ')})`
            : `CREATE INDEX ${tempName.substring(0, tempName.length - 1)}_idx${
                this.columnEscapeCharacter
              } ON ${tempName} (${indexedCols.join(', ')})`;
        mutableOutput.logInfo(applyIndex);
        const measuredIndex = await measureQueryTime(async () => await queryFn(applyIndex));
        mutableOutput.logInfo(`Took ${measuredIndex.time}ms`);

        const analyzeQuery = `${this.tableAnalyzePrefix} ${tempName}${capitalizeSchemaOrTable ? ' COMPUTE STATISTICS FOR TABLE' : ''}`;
        mutableOutput.logInfo(analyzeQuery);
        const { time: measuredAnalyzeTime } = await measureQueryTime(async () => await queryFn(analyzeQuery));
        mutableOutput.logInfo(`Took ${measuredAnalyzeTime}ms`);

        const distinctQuery = `SELECT COUNT(*) as ${this.escapeAsCol('count')}, COUNT(${schemaAndTable}.${this.escapeAsCol(
          filterBy[0]
        )}) as ${this.escapeAsCol('non_null')} FROM ${tempName}
LEFT JOIN ${schemaAndTable} ON ${filterBy
          .map((c) => `${schemaAndTable}.${this.escapeAsCol(c)} = ${tempName}.${this.escapeAsCol(c)}`)
          .join(' AND ')}`;
        mutableOutput.logInfo(distinctQuery);
        const { time: distinctTime, result: distinctResults } = await measureQueryTime(async () => await queryFn(distinctQuery));
        mutableOutput.logInfo(`Took ${distinctTime}ms`);
        const count = typeof distinctResults?.[0]?.count === 'string' ? parseInt(distinctResults?.[0]?.count) : distinctResults?.[0]?.count;
        const nonNullCount =
          typeof distinctResults?.[0]?.non_null === 'string' ? parseInt(distinctResults?.[0]?.non_null) : distinctResults?.[0]?.non_null;
        if (!count) {
          throw new IntegrationError(
            `Update rolled back because no matches were found on ${this.escapeAsCol(table)} on columns ${filterBy.join(', ')}`,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        if (count !== updatedRows.length) {
          throw new IntegrationError(
            `Update rolled back because the uniqueness constraint was not met by ${this.escapeAsCol(table)}. You provided ${
              updatedRows.length
            } rows, and ${count} rows were matched. `,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        if (nonNullCount !== updatedRows.length) {
          throw new IntegrationError(
            `Update rolled back because you provided ${updatedRows.length} rows, but table ${this.escapeAsCol(
              table
            )} contains ${nonNullCount} matching rows. `,
            ErrorCode.INTEGRATION_SYNTAX
          );
        }
        // insert if we have rows to insert
        if (insertedRows.length > 0 && queryFnMany) {
          for (const [insertQuery, insertParams] of insertQueriesAndParams) {
            mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
            const { time: updateTime } = await measureQueryTime(
              async () => await queryFnMany(insertQuery as string, insertParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${updateTime}ms`);
          }
        } else if (insertedRows.length > 0) {
          for (const [insertQuery, insertParams] of insertQueriesAndParams) {
            mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
            const { time: updateTime } = await measureQueryTime(
              async () => await queryFn(insertQuery as string, insertParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${updateTime}ms`);
          }
        }

        // If a bulk edit function isn't passed, there are two possible multi-table UPDATE statements based on the SQL dialect
        let updateQuery;

        if (queryFnMany) {
          updateQuery = `MERGE INTO ${schemaAndTable} USING (SELECT ${columnOrder
            .map((c) => this.escapeAsCol(joinColumnMapping[c]))
            .concat(filterBy.map((c) => this.escapeAsCol(c)))
            .join(', ')} 
          FROM ${tempName}) temptable ON (${filterBy
            .map((c) => `${schemaAndTable}.${this.escapeAsCol(c)} = temptable.${this.escapeAsCol(c)}`)
            .join(' AND ')})
          WHEN MATCHED THEN UPDATE SET ${columnOrder
            .map(
              (c) =>
                `${!this.useSqlUpdateFromStatement ? `${schemaAndTable}.` : ``}${this.escapeAsCol(c)} = temptable.${this.escapeAsCol(
                  joinColumnMapping[c] ?? c
                )}`
            )
            .join(', ')}`;
        } else {
          updateQuery = `UPDATE ${schemaAndTable}${!this.useSqlUpdateFromStatement ? `, ${tempName}` : ``}
SET ${columnOrder
            .map(
              (c) =>
                `${!this.useSqlUpdateFromStatement ? `${schemaAndTable}.` : ``}${this.escapeAsCol(c)} = ${tempName}.${this.escapeAsCol(
                  joinColumnMapping[c] ?? c
                )}`
            )
            .join(', ')}${
            this.useSqlUpdateFromStatement
              ? `
FROM ${tempName}`
              : ``
          }
WHERE ${filterBy.map((c) => `${schemaAndTable}.${this.escapeAsCol(c)} = ${tempName}.${this.escapeAsCol(c)}`).join(' AND ')}${
            this.trailingSemicolon ? ';' : ''
          }`;
          mutableOutput.logInfo(updateQuery);
        }
        const { time: updateTime } = await measureQueryTime(async () => await queryFn(updateQuery));
        mutableOutput.logInfo(`Took ${updateTime}ms`);

        // delete if we have rows to delete
        if (deletedRows.length > 0) {
          for (const [deleteQuery, deleteParams] of deleteQueriesAndParams) {
            mutableOutput.logInfo(`${deleteQuery} - params ${JSON.stringify(deleteParams)}`);
            const { time: updateTime } = await measureQueryTime(
              async () => await queryFn(deleteQuery as string, deleteParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${updateTime}ms`);
          }
        }

        if (!this.skipTransaction) {
          mutableOutput.logInfo('COMMIT');
          const { time: commitTime } = await measureQueryTime(async () => await queryFn('COMMIT'));
          mutableOutput.logInfo(`Took ${commitTime}ms`);
        }
      } catch (err) {
        if (!this.skipTransaction) {
          mutableOutput.logInfo('ROLLBACK');
          const { time: rollbackTime } = await measureQueryTime(async () => await queryFn('ROLLBACK'));
          mutableOutput.logInfo(`Took ${rollbackTime}ms`);
        }
        throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.INTEGRATION_SYNTAX);
      }
    } else if (deletedRows.length > 0 || insertedRows.length > 0) {
      // have inserts or deletes but not updates
      try {
        if (!this.skipTransaction && (insertQueriesAndParams.length > 1 || deleteQueriesAndParams.length > 1)) {
          mutableOutput.logInfo('Beginning transaction');
          await queryFn(`BEGIN`);
        }

        if (insertedRows.length > 0 && queryFnMany) {
          for (const [insertQuery, insertParams] of insertQueriesAndParams) {
            mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
            const { time: updateTime } = await measureQueryTime(
              async () => await queryFnMany(insertQuery as string, insertParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${updateTime}ms`);
          }
        } else if (insertedRows.length > 0) {
          for (const [insertQuery, insertParams] of insertQueriesAndParams) {
            mutableOutput.logInfo(`${insertQuery} - params ${JSON.stringify(insertParams)}`);
            const { time: insertTime } = await measureQueryTime(
              async () => await queryFn(insertQuery as string, insertParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${insertTime}ms`);
          }
        }

        if (deletedRows.length > 0) {
          for (const [deleteQuery, deleteParams] of deleteQueriesAndParams) {
            mutableOutput.logInfo(`${deleteQuery} - params ${JSON.stringify(deleteParams)}`);
            const { time: deleteTime } = await measureQueryTime(
              async () => await queryFn(deleteQuery as string, deleteParams as Array<unknown>)
            );
            mutableOutput.logInfo(`Took ${deleteTime}ms`);
          }
        }

        if (!this.skipTransaction && (insertQueriesAndParams.length > 1 || deleteQueriesAndParams.length > 1)) {
          mutableOutput.logInfo('COMMIT');
          const { time: commitTime } = await measureQueryTime(async () => await queryFn('COMMIT'));
          mutableOutput.logInfo(`Took ${commitTime}ms`);
        }
      } catch (err) {
        if (!this.skipTransaction && deletedRows.length > 0 && insertedRows.length > 0) {
          mutableOutput.logInfo('ROLLBACK');
          const { time: rollbackTime } = await measureQueryTime(async () => await queryFn('ROLLBACK'));
          mutableOutput.logInfo(`Took ${rollbackTime}ms`);
        }
        throw new IntegrationError(`Query failed, ${err.message}`, ErrorCode.INTEGRATION_SYNTAX);
      }
    }
  }

  protected _validateActionConfigurationForUpdate(actionConfiguration: DBActionConfiguration): void {
    if (!actionConfiguration.table) {
      throw new IntegrationError('Table is required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (!actionConfiguration.schema) {
      throw new IntegrationError('Schema is required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    if (!actionConfiguration.insertedRows && !actionConfiguration.newValues && !actionConfiguration.deletedRows) {
      throw new IntegrationError(
        'No rows given. Must provide at least one of Inserted Rows, Updated Rows, or Deleted Rows',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
      );
    }
  }

  // if needed, this will format a string if it is mixed case
  protected wrapForCaseIfNeeded(originalString: string): string {
    // check if we have a wrap character and this is a mixed case string
    let newString = originalString;
    if (this.caseSensitivityWrapCharacter) {
      newString = `${this.caseSensitivityWrapCharacter}${originalString}${this.caseSensitivityWrapCharacter}`;
    }
    return newString;
  }

  protected _retrieveMappedRows(rows: Record<string, unknown>[], lookupColumnName: Record<string, string>): Record<string, unknown>[] {
    rows = rows.map((row) => {
      const newRow = {};
      for (const [column, value] of Object.entries(row)) {
        // only get mapped columns
        if (column in lookupColumnName) {
          newRow[lookupColumnName[column]] = value;
        }
      }
      return newRow;
    });
    return rows;
  }
  escapeAsCol(str: string): string {
    if (this.columnEscapeCharacter.length === 2) {
      // Some SQL engines use [] for identifier references, such as [tablename].[column]
      // In this case we need to escape using [[ or ]]
      let newStr = str;
      for (const char of this.columnEscapeCharacter) {
        // Escape the special characters [ and ]
        newStr = newStr.replace(new RegExp('\\' + char, 'g'), `${char}${char}`);
      }
      return this.columnEscapeCharacter[0] + newStr + this.columnEscapeCharacter[1];
    }

    // Typical SQL engines use " or ` for identifier references, such as "tablename". To escape a quote inside the identifier, most engines
    // support doubling.
    return (
      this.columnEscapeCharacter +
      str.replace(new RegExp(this.columnEscapeCharacter, 'g'), `${this.columnEscapeCharacter}${this.columnEscapeCharacter}`) +
      this.columnEscapeCharacter
    );
  }

  // This function is mocked for testing since it relies on dates. The use of dates is because
  // using an existing table name can throw errors, especially if we're using the same DB connection
  getTempTableName(): string {
    return this.escapeAsCol(`sbwritetable${+new Date()}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function measureQueryTime(cb: () => Promise<any>) {
  const start = performance.now();
  const result = await cb();
  return {
    result,
    time: (performance.now() - start).toFixed()
  };
}
