import {
  Column,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CreateConnection,
  DatabasePluginPooled,
  DatasourceMetadataDto,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  Key,
  LakebaseActionConfiguration,
  LakebaseDatasourceConfiguration,
  normalizeTableColumnNames,
  PluginExecutionProps,
  RawRequest,
  Schema,
  Table,
  TableType
} from '@superblocks/shared';
import { LakebasePluginV1 } from '@superblocksteam/types';
import { isEmpty } from 'lodash';
import { Client, Notification } from 'pg';
import { KEYS_QUERY, TABLE_QUERY } from './queries';

const TEST_CONNECTION_TIMEOUT = 5000;

// This identifies our integration to Databricks and MUST be included
const DATABRICKS_APPLICATION_NAME = 'Superblocks';

export default class LakebasePlugin extends DatabasePluginPooled<Client, LakebaseDatasourceConfiguration> {
  pluginName = 'Lakebase';
  protected readonly parameterType = '$';
  protected readonly caseSensitivityWrapCharacter = '"';

  public async executePooled(
    { context, actionConfiguration }: PluginExecutionProps<LakebaseDatasourceConfiguration, LakebaseActionConfiguration>,
    client: Client
  ): Promise<ExecutionOutput> {
    const query = actionConfiguration.body;
    const ret = new ExecutionOutput();
    if (isEmpty(query)) {
      return ret;
    }
    let rows;
    try {
      rows = await this.executeQuery(() => {
        return client.query(query, context.preparedStatementContext);
      });
    } catch (err) {
      throw this._handleError(err, 'Query failed');
    }
    ret.output = normalizeTableColumnNames(rows.rows);
    return ret;
  }

  public getRequest(actionConfiguration: LakebaseActionConfiguration): RawRequest {
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body'];
  }

  public async metadata(datasourceConfiguration: LakebaseDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    let client: Client | null = null;
    try {
      client = await this.createConnection(datasourceConfiguration);
    } catch (err) {
      throw new IntegrationError(`Failed to connect to ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
    try {
      // Get tables and columns
      const tableResult = await this.executeQuery(async () => {
        return client!.query(TABLE_QUERY);
      });

      const schemaNames = new Set<string>();
      const tables = tableResult.rows.reduce((acc: Table[], attribute) => {
        const entityName = attribute['table_name'];
        const entitySchema = attribute['schema_name'];
        const entityType = TableType.TABLE;

        schemaNames.add(entitySchema);

        const entity = acc.find((o) => o.name === entityName && o.schema === entitySchema);
        if (entity) {
          entity.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));
          return acc;
        }

        const table = new Table(entityName, entityType, entitySchema);
        table.columns.push(new Column(attribute.name, attribute.column_type, this.escapeAsCol(attribute.name)));
        return [...acc, table];
      }, []);

      const schemas = Array.from(schemaNames).map((name) => new Schema(name));

      // Get keys
      const keysResult = await this.executeQuery(async () => {
        return client!.query(KEYS_QUERY);
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
      throw new IntegrationError(`Failed to fetch metadata from ${this.pluginName}, ${err.message}`, ErrorCode.INTEGRATION_NETWORK, {
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

  /**
   * Get OAuth M2M access token from Databricks
   * Uses client credentials flow: https://docs.databricks.com/aws/en/dev-tools/auth/oauth-m2m#manually-generate-a-workspace-level-access-token
   */
  private async getM2MAccessToken(workspaceUrl: string, clientId: string, clientSecret: string): Promise<string> {
    // Normalize workspace URL - remove trailing slash and ensure https
    let normalizedUrl = workspaceUrl.trim();
    if (!normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    const tokenUrl = `${normalizedUrl}/oidc/v1/token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'all-apis'
    });

    // Use HTTP Basic Auth as per Databricks docs
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new IntegrationError(
        `Failed to get OAuth M2M access token: ${response.status} - ${response.statusText}`,
        ErrorCode.INTEGRATION_AUTHORIZATION,
        { pluginName: this.pluginName }
      );
    }

    const tokenData = await response.json();

    if (!tokenData.access_token) {
      throw new IntegrationError('Failed to find access token in OAuth response', ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }

    return tokenData.access_token;
  }

  @CreateConnection
  protected async createConnection(
    datasourceConfiguration: LakebaseDatasourceConfiguration,
    connectionTimeoutMillis = 30000
  ): Promise<Client> {
    if (!datasourceConfiguration) {
      throw new IntegrationError('Datasource not found', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    const connection = datasourceConfiguration.connection;
    if (!connection) {
      throw new IntegrationError('Connection configuration not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    const host = connection.host;
    const port = connection.port ?? 5432;
    const databaseName = connection.databaseName;

    if (!host) {
      throw new IntegrationError('Host not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }
    if (!databaseName) {
      throw new IntegrationError('Database name not specified', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    let user: string;
    let password: string;

    // connectionType comes as string from UI but proto enum is numeric
    const connectionType = typeof connection.connectionType === 'string' 
      ? parseInt(connection.connectionType, 10) 
      : connection.connectionType;
    
    switch (connectionType) {
      case LakebasePluginV1.Plugin_ConnectionType.OAUTH_M2M: {
        const clientId = connection.oauthClientId;
        const clientSecret = connection.oauthClientSecret;
        const workspaceUrl = connection.oauthWorkspaceUrl;

        if (!clientId || !clientSecret) {
          throw new IntegrationError('OAuth M2M requires client ID and client secret', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        if (!workspaceUrl) {
          throw new IntegrationError('OAuth M2M requires workspace URL for token endpoint', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        user = clientId;
        password = await this.getM2MAccessToken(workspaceUrl, clientId, clientSecret);
        break;
      }

      case LakebasePluginV1.Plugin_ConnectionType.OAUTH_FEDERATION: {
        if (!datasourceConfiguration.authConfig?.authToken) {
          throw new IntegrationError(
            'OAuth Token Federation token expected but not present',
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            {
              pluginName: this.pluginName
            }
          );
        }

        // User email is populated by the orchestrator from the JWT context
        const databricksUsername = datasourceConfiguration.authConfig?.userEmail;
        if (!databricksUsername) {
          throw new IntegrationError(
            'Token Federation requires user email from authentication context',
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            {
              pluginName: this.pluginName
            }
          );
        }

        user = databricksUsername;
        password = datasourceConfiguration.authConfig.authToken;
        break;
      }

      case LakebasePluginV1.Plugin_ConnectionType.USERNAME_PASSWORD:
      default: {
        const username = connection.username;
        const pwd = connection.password;

        if (!username || !pwd) {
          throw new IntegrationError('Username and password are required', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

        user = username;
        password = pwd;
        break;
      }
    }

    const client = new Client({
      host,
      port,
      user,
      password,
      database: databaseName,
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis,
      application_name: DATABRICKS_APPLICATION_NAME
    });

    this.attachLoggerToClient(client, datasourceConfiguration);

    await client.connect();
    this.logger.debug(`Lakebase client connected. ${host}:${port}`);
    return client;
  }

  @DestroyConnection
  protected async destroyConnection(client: Client): Promise<void> {
    await client.end();
  }

  private attachLoggerToClient(client: Client, datasourceConfiguration: LakebaseDatasourceConfiguration) {
    const host = datasourceConfiguration.connection?.host ?? 'unknown';
    const port = datasourceConfiguration.connection?.port ?? 5432;
    const datasourceEndpoint = `${host}:${port}`;

    client.on('error', (err: Error) => {
      this.logger.error(`Lakebase client error. ${datasourceEndpoint} ${err.stack}`);
    });

    client.on('end', () => {
      this.logger.debug(`Lakebase client disconnected from server. ${datasourceEndpoint}`);
    });

    client.on('notification', (message: Notification): void => {
      this.logger.debug(`Lakebase notification ${message}. ${datasourceEndpoint}`);
    });

    client.on('notice', (notice) => {
      this.logger.debug(`Lakebase notice: ${notice.message}. ${datasourceEndpoint}`);
    });
  }

  public async test(datasourceConfiguration: LakebaseDatasourceConfiguration): Promise<void> {
    let client: Client | null = null;
    try {
      client = await this.createConnection(datasourceConfiguration, TEST_CONNECTION_TIMEOUT);
      await this.executeQuery(() => {
        return client!.query('SELECT NOW()');
      });
    } catch (err) {
      throw this._handleError(err, 'Test connection failed');
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
      'connection refused': ErrorCode.INTEGRATION_NETWORK,
      'connection terminated': ErrorCode.INTEGRATION_NETWORK,
      'syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'query read timeout': ErrorCode.INTEGRATION_QUERY_TIMEOUT
    };

    for (const key of Object.keys(errorMap)) {
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
