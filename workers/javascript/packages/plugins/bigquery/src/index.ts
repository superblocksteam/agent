import { BigQuery } from '@google-cloud/bigquery';
import {
  BigqueryActionConfiguration,
  BigqueryDatasourceConfiguration,
  CreateConnection,
  DatabasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  Table,
  TableType
} from '@superblocks/shared';
import { OAuth2Client } from 'google-auth-library';
import { isEmpty } from 'lodash';

import { GET_DATSETS_QUERY, METADATA_BY_DATASET_QUERY } from './queries';

export default class BigqueryPlugin extends DatabasePlugin {
  pluginName = 'BigQuery';
  protected readonly parameterType = '?';

  public async execute({
    context,
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<BigqueryDatasourceConfiguration, BigqueryActionConfiguration>): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    const options = {
      query: actionConfiguration.body,
      params: context.preparedStatementContext
    };
    let client: BigQuery;
    try {
      try {
        client = await this.createConnection(datasourceConfiguration);
        if (isEmpty(actionConfiguration.body)) {
          return ret;
        }
      } catch (err) {
        throw new IntegrationError(`Connection failed: ${err}`, ErrorCode.INTEGRATION_AUTHORIZATION, { pluginName: this.pluginName });
      }

      // DEFER (jason4012) handle invalid query (syntax), network issue (network), or misc (internal)
      // These errors are possibly too complex and need to be handled individually so deferring for now
      const [rows] = await this.executeQuery(async () => {
        const [job] = await client.createQueryJob(options);
        return job.getQueryResults();
      });

      ret.output = rows;
      return ret;
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Query failed: ${err}`, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: err.stack });
    }
  }

  getRequest(actionConfiguration: BigqueryActionConfiguration): RawRequest {
    return actionConfiguration.body;
  }

  dynamicProperties(): string[] {
    return ['body'];
  }

  @CreateConnection
  private async createConnection(datasourceConfiguration: BigqueryDatasourceConfiguration): Promise<BigQuery> {
    if (!datasourceConfiguration) {
      throw new IntegrationError(`No datasource found when creating client`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
        pluginName: this.pluginName
      });
    }

    // Check if using Workforce Identity Federation (OAuth token exchange)
    if (datasourceConfiguration.connectionType === 'oauth-token-exchange') {
      return this.createConnectionWithAccessToken(datasourceConfiguration);
    }

    // Default: Service account authentication
    return this.createConnectionWithServiceAccount(datasourceConfiguration);
  }

  private createConnectionWithAccessToken(datasourceConfiguration: BigqueryDatasourceConfiguration): BigQuery {
    const accessToken = datasourceConfiguration.authConfig?.authToken;
    if (!accessToken) {
      throw new IntegrationError(
        'OAuth Token Exchange token expected but not present. Please ensure the integration is properly configured.',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
        { pluginName: this.pluginName }
      );
    }

    const authClient = new OAuth2Client();
    authClient.setCredentials({ access_token: accessToken });

    const projectId = this.getProjectId(datasourceConfiguration);
    if (!projectId) {
      throw new IntegrationError(
        'Project ID is required for Workforce Identity Federation authentication.',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
        { pluginName: this.pluginName }
      );
    }

    return new BigQuery({
      projectId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authClient: authClient as any,
      scopes: ['https://www.googleapis.com/auth/bigquery']
    });
  }

  private createConnectionWithServiceAccount(datasourceConfiguration: BigqueryDatasourceConfiguration): BigQuery {
    try {
      const credentials = this.getCredentials(datasourceConfiguration);
      const projectId = credentials['project_id'];
      const opts = {
        projectId,
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      };
      return new BigQuery(opts);
    } catch (err) {
      throw new IntegrationError(`Could not parse credentials: ${err}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
  }

  private getCredentials(datasourceConfiguration: BigqueryDatasourceConfiguration): Record<string, string> {
    return JSON.parse(datasourceConfiguration.authentication?.custom?.googleServiceAccount?.value ?? '');
  }

  private getProjectId(datasourceConfiguration: BigqueryDatasourceConfiguration): string | undefined {
    if (datasourceConfiguration.connectionType === 'oauth-token-exchange') {
      return datasourceConfiguration.authConfig?.projectId;
    }
    const credentials = this.getCredentials(datasourceConfiguration);
    return credentials['project_id'];
  }

  async metadata(datasourceConfiguration: BigqueryDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    try {
      const client = await this.createConnection(datasourceConfiguration);
      const projectId = this.getProjectId(datasourceConfiguration);
      const tablesByFullNames: Record<string, Table> = {};

      // get datasets
      const [dataset_rows] = await this.executeQuery(async () => {
        const [job] = await client.createQueryJob({ query: GET_DATSETS_QUERY });
        return job.getQueryResults();
      });

      // concurrently get metadata for each dataset
      // prepare metadata promises
      const promises = dataset_rows.map(async (dataset_row) => {
        const dataset = dataset_row['dataset'];
        // we cant parameterize the project id or dataset
        // https://cloud.google.com/bigquery/docs/parameterized-queries#node.js
        const query = METADATA_BY_DATASET_QUERY.replace('@projectId', projectId).replace('@dataset', dataset);

        return this.executeQuery(async () => {
          const [job] = await client.createQueryJob({ query });
          const [rows] = await job.getQueryResults();
          // add the dataset name to each metadata row so we don't lose it
          return rows.map((row) => ({ ...row, dataset }));
        });
      });

      const metadataResults = await Promise.all(promises);

      for (const metadataResult of metadataResults.flat()) {
        const fullTableName = `${metadataResult['dataset']}.${metadataResult['table_name']}`;
        // add table if it doesn't exist
        if (!Object.keys(tablesByFullNames).includes(fullTableName)) {
          tablesByFullNames[fullTableName] = { name: fullTableName, type: TableType.TABLE, columns: [] } as Table;
        }
        // add columns
        const table = tablesByFullNames[fullTableName];
        table.columns.push({ name: metadataResult['column_name'], type: metadataResult['data_type'] });
      }

      return {
        dbSchema: { tables: Object.values(tablesByFullNames) }
      };
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(`Metadata query failed, ${err.message}`, ErrorCode.UNSPECIFIED, {
        pluginName: this.pluginName,
        stack: err.stack
      });
    }
  }

  async test(datasourceConfiguration: BigqueryDatasourceConfiguration): Promise<void> {
    let client;
    try {
      client = await this.createConnection(datasourceConfiguration);
      const options = { query: 'SELECT 1' };
      await this.executeQuery(async () => {
        const [job] = await client.createQueryJob(options);
        await job.getQueryResults();
      });
    } catch (err) {
      throw new IntegrationError(`Test connection failed, ${err.message}`, ErrorCode.INTEGRATION_AUTHORIZATION, {
        pluginName: this.pluginName
      });
    }
  }
}
