import { Signer } from '@aws-sdk/rds-signer';
import {
  ClientWrapper,
  Column,
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  getAwsClientConfigWithTempCreds,
  IntegrationError,
  Key,
  normalizeTableColumnNames,
  PluginExecutionProps,
  PostgresActionConfiguration,
  PostgresDatasourceConfiguration,
  RawRequest,
  Schema,
  SqlOperations,
  SQLQueryEnum,
  Table,
  TableType
} from '@superblocks/shared';
import { isEmpty } from 'lodash';
import { Client, Notification } from 'pg';
import { Client as ssh2Client } from 'ssh2';

import { DEFAULT_SCHEMA_QUERY, KEYS_QUERY, PRIMARY_KEY_QUERY, SET_SEARCH_PATH, SQL_SINGLE_TABLE_METADATA, TABLE_QUERY } from './queries';
import { getAwsRdsTlsCaCertificates } from './rds-ca';

const TEST_CONNECTION_TIMEOUT = 20000;
const POSTGRES_IAM_ALLOWED_ROLE_ARN_PREFIXES = 'SUPERBLOCKS_POSTGRES_IAM_ALLOWED_ROLE_ARN_PREFIXES';
const POSTGRES_DNS_ERROR_CODES = new Set(['EAI_AGAIN', 'ENOTFOUND']);
const POSTGRES_NETWORK_ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'ETIMEDOUT']);
const POSTGRES_TLS_CERTIFICATE_ERROR_CODES = new Set([
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
]);

type PostgresIamConnectionConfiguration = {
  database: string;
  hostname: string;
  port: number;
  region: string;
  roleArn: string;
  sessionPolicy?: string;
  username: string;
};

function requirePostgresIamString(value: string | undefined, errorMessage: string): string {
  if (!value?.trim()) {
    throw new IntegrationError(errorMessage, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }
  return value.trim();
}

function postgresIamTlsEnabled(value: boolean | string | undefined): boolean {
  return value === true || value === 'checked' || value === 'true';
}

function postgresIamConnectionError(error: unknown, pluginName: string): IntegrationError {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  if (code !== undefined && POSTGRES_TLS_CERTIFICATE_ERROR_CODES.has(code)) {
    return new IntegrationError('Postgres TLS certificate verification failed', ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName });
  }
  if (code === '28P01') {
    return new IntegrationError('Postgres database authentication failed', ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName });
  }
  if (code !== undefined && POSTGRES_DNS_ERROR_CODES.has(code)) {
    return new IntegrationError('Postgres hostname resolution failed', ErrorCode.INTEGRATION_NETWORK, { pluginName });
  }
  if (code !== undefined && POSTGRES_NETWORK_ERROR_CODES.has(code)) {
    return new IntegrationError('Postgres network connection failed', ErrorCode.INTEGRATION_NETWORK, { pluginName });
  }
  return new IntegrationError('Postgres IAM connection failed', ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName });
}

async function closeFailedPostgresConnection(client: Client | null, tunnel: ssh2Client | null): Promise<void> {
  if (client !== null) {
    try {
      await client.end();
    } catch {
      // Preserve the original connection error.
    }
  }
  if (tunnel !== null) {
    try {
      tunnel.end();
    } catch {
      // Preserve the original connection error.
    }
  }
}

function getPostgresIamAllowedRoleArns(): string[] {
  const rawAllowlist = process.env[POSTGRES_IAM_ALLOWED_ROLE_ARN_PREFIXES];
  if (rawAllowlist === undefined || rawAllowlist.trim() === '') {
    return [];
  }

  let parsedAllowlist: unknown;
  try {
    parsedAllowlist = JSON.parse(rawAllowlist);
  } catch {
    throw new IntegrationError('Invalid Postgres IAM role allowlist configuration', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }
  if (!Array.isArray(parsedAllowlist)) {
    throw new IntegrationError('Invalid Postgres IAM role allowlist configuration', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }

  const allowedRoleArns: string[] = [];
  for (const item of parsedAllowlist) {
    if (typeof item !== 'string') {
      throw new IntegrationError('Invalid Postgres IAM role allowlist configuration', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
    }
    const roleArn = item.trim();
    if (roleArn !== '') {
      allowedRoleArns.push(roleArn);
    }
  }
  return allowedRoleArns;
}

function validatePostgresIamConfiguration(datasourceConfiguration: PostgresDatasourceConfiguration): PostgresIamConnectionConfiguration {
  if (datasourceConfiguration.connectionType === 'url') {
    throw new IntegrationError('IAM authentication requires a field-based connection', ErrorCode.INTEGRATION_AUTHORIZATION);
  }
  if (!postgresIamTlsEnabled(datasourceConfiguration.connection?.useSsl)) {
    throw new IntegrationError('TLS must be enabled for Postgres IAM authentication', ErrorCode.INTEGRATION_AUTHORIZATION);
  }

  const hostname = requirePostgresIamString(
    datasourceConfiguration.endpoint?.host,
    'Endpoint host not specified for Postgres IAM authentication'
  );
  const rawPort = datasourceConfiguration.endpoint?.port as number | string | undefined;
  if (rawPort === undefined) {
    throw new IntegrationError('Endpoint port not specified for Postgres IAM authentication', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD);
  }
  const port = typeof rawPort === 'string' ? Number(rawPort) : rawPort;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new IntegrationError(
      'Valid endpoint port not specified for Postgres IAM authentication',
      ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD
    );
  }

  const username = requirePostgresIamString(
    datasourceConfiguration.authentication?.username,
    'Database username not specified for Postgres IAM authentication'
  );
  const database = requirePostgresIamString(
    datasourceConfiguration.authentication?.custom?.databaseName?.value,
    'Database not specified for Postgres IAM authentication'
  );
  const roleArn = requirePostgresIamString(
    datasourceConfiguration.authentication?.custom?.iamRoleArn?.value,
    'IAM role ARN not specified for Postgres IAM authentication'
  );
  if (!roleArn.startsWith('arn:aws:iam::')) {
    throw new IntegrationError(
      'Postgres IAM authentication currently supports commercial AWS Regions only',
      ErrorCode.INTEGRATION_AUTHORIZATION
    );
  }
  const region = requirePostgresIamString(
    datasourceConfiguration.authentication?.custom?.region?.value,
    'AWS region not specified for Postgres IAM authentication'
  );
  if (region.startsWith('cn-') || region.startsWith('us-gov-')) {
    throw new IntegrationError(
      'Postgres IAM authentication currently supports commercial AWS Regions only',
      ErrorCode.INTEGRATION_AUTHORIZATION
    );
  }
  const allowedRoleArns = getPostgresIamAllowedRoleArns();
  const roleAllowed = allowedRoleArns.some((allowedRoleArn) =>
    allowedRoleArn.endsWith('/') ? roleArn.startsWith(allowedRoleArn) : roleArn === allowedRoleArn
  );
  if (!roleAllowed) {
    throw new IntegrationError('IAM role is not allowed for Postgres authentication', ErrorCode.INTEGRATION_AUTHORIZATION);
  }

  return {
    database,
    hostname,
    port,
    region,
    roleArn,
    sessionPolicy: datasourceConfiguration.authentication?.custom?.sessionPolicy?.value,
    username
  };
}

export default class PostgresPlugin extends DatabasePluginPooled<ClientWrapper<Client, ssh2Client>, PostgresDatasourceConfiguration> {
  pluginName = 'Postgres';
  protected readonly parameterType = '$';
  protected readonly columnEscapeCharacter = '"';
  protected readonly sqlSingleTableMetadata = SQL_SINGLE_TABLE_METADATA;
  protected readonly sqlQueryMap: Record<SQLQueryEnum, string> = {
    [SQLQueryEnum.SQL_KEYS]: KEYS_QUERY,
    [SQLQueryEnum.SQL_PRIMARY_KEY]: PRIMARY_KEY_QUERY,
    [SQLQueryEnum.SQL_SCHEMA]: DEFAULT_SCHEMA_QUERY,
    [SQLQueryEnum.SQL_SEARCH_PATH]: SET_SEARCH_PATH,
    [SQLQueryEnum.SQL_SINGLE_TABLE_METADATA]: SQL_SINGLE_TABLE_METADATA,
    [SQLQueryEnum.SQL_TABLE]: TABLE_QUERY
  };
  protected readonly caseSensitivityWrapCharacter = '"';

  protected getConnectionPoolIdentity(datasourceConfiguration: PostgresDatasourceConfiguration): PostgresDatasourceConfiguration {
    if (datasourceConfiguration.authentication?.authType !== 'aws_iam_role') {
      return datasourceConfiguration;
    }

    const authentication = structuredClone(datasourceConfiguration.authentication);
    delete authentication.password;
    Object.freeze(authentication);
    const tunnel = datasourceConfiguration.tunnel === undefined ? undefined : structuredClone(datasourceConfiguration.tunnel);
    if (tunnel !== undefined) {
      Object.freeze(tunnel);
    }

    const identity = {
      ...datasourceConfiguration,
      authentication,
      tunnel
    };
    Object.freeze(identity);
    return identity;
  }

  public async executePooled(
    props: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration>,
    client: ClientWrapper<Client, ssh2Client>
  ): Promise<undefined> {
    switch (props.actionConfiguration.operation) {
      case SqlOperations.UPDATE_ROWS: {
        // make sure schema is set
        let result;
        if (!props.actionConfiguration.schema) {
          result = await this.executeQuery(() => {
            return client.client.query(DEFAULT_SCHEMA_QUERY);
          });
          if (result.rows.length == 0) {
            throw new IntegrationError(`Query failed, no schema found`, ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
          }
          props.actionConfiguration.schema = result.rows[0].current_schema;
        }
        // validation
        this._validateActionConfigurationForUpdate(props.actionConfiguration);
        await this.executeUpdate(props, client);
        return;
      }
      default: {
        // Includes undefined & run_sql modes
        await this.executeSql(props, client);
        return;
      }
    }
  }

  private async executeSql(
    { context, actionConfiguration, mutableOutput }: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration>,
    client: ClientWrapper<Client, ssh2Client>
  ): Promise<void> {
    const query = actionConfiguration.body;
    if (isEmpty(query)) {
      return;
    }
    let rows;
    try {
      rows = await this.executeQuery(() => {
        return client.client.query(query, context.preparedStatementContext);
      });
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
    mutableOutput.output = normalizeTableColumnNames(rows.rows);
  }

  private async executeUpdate(
    { mutableOutput, actionConfiguration }: PluginExecutionProps<PostgresDatasourceConfiguration, PostgresActionConfiguration>,
    client: ClientWrapper<Client, ssh2Client>
  ): Promise<void> {
    if (actionConfiguration.useAdvancedMatching === 'advanced') {
      await this._executeUpdateRowsByCols({ mutableOutput, actionConfiguration }, async (...args) => {
        return (await client.client.query(...args))?.rows;
      });
    } else {
      // pg_catalog is the fastest way to get table info in Postgres
      // https://dba.stackexchange.com/questions/302587/what-is-faster-pg-catalog-or-information-schema
      await this._executeUpdateRowsPrimary({ mutableOutput, actionConfiguration, primaryKeyQuery: PRIMARY_KEY_QUERY }, async (...args) => {
        return (await client.client.query(...args))?.rows;
      });
    }
  }

  public getRequest(actionConfiguration: PostgresActionConfiguration): RawRequest {
    if (actionConfiguration.operation === SqlOperations.UPDATE_ROWS) {
      return undefined;
    }
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body', 'oldValues', 'insertedRows', 'newValues', 'deletedRows'];
  }

  public async metadata(datasourceConfiguration: PostgresDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    let client;
    try {
      client = await this.createConnection(datasourceConfiguration);
    } catch (err) {
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
    try {
      // set search path
      try {
        await this.executeQuery(async () => {
          return client.client.query(SET_SEARCH_PATH);
        });
      } catch (err) {
        // don't have access to mutable output here so just log
        console.warn(`Failed to set search path: ${err.message}`);
      }
      // table
      const tableResult = await this.executeQuery(async () => {
        return client.client.query(TABLE_QUERY);
      });
      const tables = tableResult.rows.reduce((acc, attribute) => {
        const entityName = attribute['table_name'];
        const entitySchema = attribute['schema_name'];
        const entityType = TableType.TABLE;

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          const columns = entity.columns;
          entity.columns = [...columns, new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name))];
          return [...acc];
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));

        return [...acc, table];
      }, []);
      const schemaNames = new Set();
      const schemas = tableResult.rows.reduce((acc, attribute) => {
        const entityName = attribute['schema_name'];
        if (!schemaNames.has(entityName)) {
          schemaNames.add(entityName);
          const schema = new Schema(entityName);
          acc.push(schema);
        }
        return acc;
      }, []);

      // keys
      const keysResult = await this.executeQuery(async () => {
        return client.client.query(KEYS_QUERY);
      });
      keysResult.rows.forEach((key) => {
        const table = tables.find((e) => e.name === key.self_table);
        if (table) {
          table.keys.push({
            name: key.constraint_name,
            type: key.constraint_type === 'p' ? 'primary key' : 'foreign key',
            columns: key.self_columns
          } as Key);
        }
      });
      return {
        dbSchema: { tables, schemas }
      };
    } catch (err) {
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    } finally {
      if (client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: PostgresDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<ClientWrapper<Client, ssh2Client>> {
    if (!datasourceConfiguration) {
      throw new IntegrationError(`Datasource not found for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    const iamConfiguration =
      datasourceConfiguration.authentication?.authType === 'aws_iam_role'
        ? validatePostgresIamConfiguration(datasourceConfiguration)
        : undefined;
    let client: Client | null = null;
    let tunnel: ssh2Client | null = null;

    try {
      switch (datasourceConfiguration.connectionType) {
        case 'url': {
          if (!datasourceConfiguration.connectionUrl) {
            throw new IntegrationError('Expected to receive connection url for connection type url');
          }
          const connectionString = datasourceConfiguration.connectionUrl;
          client = new Client(connectionString);
          break;
        }
        default: {
          const endpoint = datasourceConfiguration.endpoint;
          const auth = datasourceConfiguration.authentication;
          if (!endpoint) {
            throw new IntegrationError(`Endpoint not specified for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }
          if (!auth) {
            throw new IntegrationError(
              `Authentication not specified for ${this.pluginName} step`,
              ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
              {
                pluginName: this.pluginName
              }
            );
          }
          if (!auth.custom?.databaseName?.value) {
            throw new IntegrationError(`Database not specified for ${this.pluginName} step`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
              pluginName: this.pluginName
            });
          }

          // The final endpoint might actually be overwritten by an SSH tunnel.
          const finalEndpoint = {
            host: iamConfiguration?.hostname ?? datasourceConfiguration.endpoint?.host,
            port: iamConfiguration?.port ?? datasourceConfiguration.endpoint?.port
          };
          if (datasourceConfiguration.tunnel && datasourceConfiguration.tunnel.enabled) {
            try {
              const tunneledAddress = await super.createTunnel(datasourceConfiguration);
              finalEndpoint.host = tunneledAddress?.host;
              finalEndpoint.port = tunneledAddress?.port;
              tunnel = tunneledAddress?.client;
            } catch (e) {
              throw new IntegrationError(`SSH tunnel connection failed for ${this.pluginName}: ${e.message}`, e.code, {
                pluginName: this.pluginName
              });
            }
          }

          let ssl_config: Record<string, unknown> | undefined;
          if (datasourceConfiguration.connection?.useSsl) {
            ssl_config = {
              rejectUnauthorized: iamConfiguration !== undefined
            };
            if (iamConfiguration) {
              ssl_config.servername = iamConfiguration.hostname;
              ssl_config.ca = getAwsRdsTlsCaCertificates();
              if (postgresIamTlsEnabled(datasourceConfiguration.connection.useSelfSignedSsl)) {
                if (datasourceConfiguration.connection.ca !== undefined) {
                  ssl_config.ca = datasourceConfiguration.connection.ca;
                }
                if (datasourceConfiguration.connection.key !== undefined) {
                  ssl_config.key = datasourceConfiguration.connection.key;
                }
                if (datasourceConfiguration.connection.cert !== undefined) {
                  ssl_config.cert = datasourceConfiguration.connection.cert;
                }
              }
            } else if (datasourceConfiguration.connection?.useSelfSignedSsl) {
              ssl_config.ca = datasourceConfiguration.connection?.ca;
              ssl_config.key = datasourceConfiguration.connection?.key;
              ssl_config.cert = datasourceConfiguration.connection?.cert;
            }
          }

          let password = auth.password;
          if (iamConfiguration) {
            const awsClientConfig = await getAwsClientConfigWithTempCreds(
              { region: iamConfiguration.region },
              datasourceConfiguration.id ?? datasourceConfiguration.name,
              iamConfiguration.region,
              iamConfiguration.roleArn,
              iamConfiguration.sessionPolicy
            );
            const signer = new Signer({
              credentials: awsClientConfig.credentials,
              hostname: iamConfiguration.hostname,
              port: iamConfiguration.port,
              region: iamConfiguration.region,
              username: iamConfiguration.username
            });
            const authToken = await signer.getAuthToken();
            password = authToken;
          }

          client = new Client({
            host: finalEndpoint?.host,
            port: finalEndpoint?.port,
            user: iamConfiguration?.username ?? auth.username,
            password,
            database: iamConfiguration?.database ?? auth.custom.databaseName.value,
            ssl: ssl_config,
            connectionTimeoutMillis: connectionTimeoutMillis
          });
          this.attachLoggerToClient(client, datasourceConfiguration);

          this.logger.debug(
            `Connecting to postgres, host: ${finalEndpoint?.host}, port: ${finalEndpoint?.port}, username: ${auth?.username}, database: ${auth?.custom?.databaseName?.value}, sslEnabled: ${datasourceConfiguration?.connection?.useSsl}`
          );
          break;
        }
      }

      try {
        await client.connect();
      } catch (err) {
        if (iamConfiguration) {
          throw postgresIamConnectionError(err, this.pluginName);
        }
        throw err;
      }
      this.logger.debug(`Postgres client connected. ${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`);
      return { client, tunnel };
    } catch (err) {
      await closeFailedPostgresConnection(client, tunnel);
      throw err;
    }
  }

  @DestroyConnection
  protected async destroyConnection(client: ClientWrapper<Client, ssh2Client>): Promise<void> {
    await client.client.end();
    client.tunnel?.end();
  }

  private attachLoggerToClient(client: Client, datasourceConfiguration: PostgresDatasourceConfiguration) {
    if (!datasourceConfiguration.endpoint) {
      return;
    }

    const datasourceEndpoint = `${datasourceConfiguration.endpoint?.host}:${datasourceConfiguration.endpoint?.port}`;

    client.on('error', (err: Error) => {
      this.logger.error(`Postgres client error. ${datasourceEndpoint} ${err.stack}`);
    });

    client.on('end', () => {
      this.logger.debug(`Postgres client disconnected from server. ${datasourceEndpoint}`);
    });

    client.on('notification', (message: Notification): void => {
      this.logger.debug(`Postgres notification ${message}. ${datasourceEndpoint}`);
    });

    client.on('notice', (notice) => {
      this.logger.debug(`Postgres notice: ${notice.message}. ${datasourceEndpoint}`);
    });
  }

  public async test(datasourceConfiguration: PostgresDatasourceConfiguration): Promise<void> {
    let client: ClientWrapper<Client, ssh2Client> | null = null;
    try {
      try {
        client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
      } catch (err) {
        if (err instanceof IntegrationError) {
          throw err;
        }
        throw new IntegrationError(`Test connection failed: ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
          pluginName: this.pluginName
        });
      }

      await this.executeQuery(() => {
        return client?.client.query('SELECT NOW()');
      });
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Test connection failed: ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
        pluginName: this.pluginName
      });
    } finally {
      if (client) {
        this.destroyConnection(client).catch(() => {
          // Error handling is done in the decorator
        });
      }
    }
  }

  private _handleError(error: Error, initialMessage: string): IntegrationError {
    if (error instanceof IntegrationError) {
      return new IntegrationError(
        `${initialMessage}: ${error.message}`,
        (error as IntegrationError).code,
        (error as IntegrationError).internalCode
      );
    }

    const message = `${initialMessage}: ${error.message}`;
    const errorMap: Record<string, ErrorCode> = {
      'client was closed and is not queryable': ErrorCode.INTEGRATION_NETWORK,
      'connection closed': ErrorCode.INTEGRATION_NETWORK,
      'syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'query read timeout': ErrorCode.INTEGRATION_QUERY_TIMEOUT
    };

    for (const key in errorMap) {
      if (error.message.toLowerCase().includes(key)) {
        return new IntegrationError(message, errorMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, {
      code: (error as unknown as { code?: number }).code,
      pluginName: this.pluginName,
      stack: error.stack
    });
  }
}
