import rocksetConfigure from '@rockset/client';
import {
  DBActionConfiguration,
  DEFAULT_ROCKSET_REGION_BASE_URL,
  DatabasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  RocksetActionConfiguration,
  RocksetDatasourceConfiguration
} from '@superblocks/shared';

export default class RocksetPlugin extends DatabasePlugin {
  pluginName = 'Rockset';
  public async execute({
    context,
    datasourceConfiguration,
    actionConfiguration
  }: PluginExecutionProps<RocksetDatasourceConfiguration, RocksetActionConfiguration>): Promise<ExecutionOutput> {
    try {
      const rocksetClient = rocksetConfigure(
        datasourceConfiguration.apiKey as string,
        datasourceConfiguration.baseURL ?? DEFAULT_ROCKSET_REGION_BASE_URL
      );
      const resp = await this.executeQuery(() => {
        return rocksetClient.queries.query({
          sql: {
            query: actionConfiguration.body ?? '',
            parameters: []
          }
        });
      });

      const ret = new ExecutionOutput();
      ret.output = resp.results;

      return ret;
    } catch (err) {
      throw this._handleError(err, 'query failed');
    }
  }

  public getRequest(actionConfiguration: DBActionConfiguration): RawRequest {
    return actionConfiguration?.body;
  }

  public dynamicProperties(): string[] {
    return ['body'];
  }

  public async metadata(datasourceConfiguration: RocksetDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  public async test(datasourceConfiguration: RocksetDatasourceConfiguration): Promise<void> {
    try {
      const rocksetClient = rocksetConfigure(
        datasourceConfiguration.apiKey as string,
        datasourceConfiguration.baseURL ?? DEFAULT_ROCKSET_REGION_BASE_URL
      );
      await this.executeQuery(() => {
        return rocksetClient.queries.query({
          sql: {
            query: 'select CURRENT_DATE()',
            parameters: []
          }
        });
      });
    } catch (err) {
      throw this._handleError(err, 'test connection failed');
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
      'Client was closed and is not queryable': ErrorCode.INTEGRATION_NETWORK,
      'Connection closed': ErrorCode.INTEGRATION_NETWORK,
      'syntax error': ErrorCode.INTEGRATION_SYNTAX,
      'Query read timeout': ErrorCode.INTEGRATION_QUERY_TIMEOUT
    };

    for (const key in errorMap) {
      if (error.message.includes(key)) {
        return new IntegrationError(message, errorMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: error.stack });
  }
}
