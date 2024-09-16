import {
  ActionResponseType,
  ApiPlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  GraphQLActionConfiguration,
  GraphQLDatasourceConfiguration,
  HttpMethod,
  IntegrationError,
  makeCurlString,
  PluginExecutionProps,
  RawRequest
} from '@superblocks/shared';
import _, { isString } from 'lodash';

export interface RequestConfig {
  query: string;
  variables?: unknown;
  operationName?: string;
}

export default class GraphQLPlugin extends ApiPlugin {
  pluginName = 'GraphQL';

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    forwardedCookies
  }: PluginExecutionProps<GraphQLDatasourceConfiguration, GraphQLActionConfiguration>): Promise<ExecutionOutput> {
    actionConfiguration = this.getMergedConfig(datasourceConfiguration, actionConfiguration);
    let url: URL;
    const query = actionConfiguration.body;

    try {
      url = new URL(actionConfiguration.path ?? '');
    } catch (err) {
      throw new IntegrationError(`URL is not valid. Error: ${err}.`, ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    }

    const host = url.hostname;

    // replace everything up to the last dot in the hostname to get domain
    const domain = host.replace(/^[^.]+\./g, '');
    const cookies = Object.entries(forwardedCookies ?? {})
      .filter(([k, v]) => v.domain === domain)
      .map(([k, v]) => `${k}=${v.value}`);

    if (cookies.length) {
      // append to existing cookies if exists
      const cookieObj = actionConfiguration.headers?.find((o) => o.key === 'Cookie');
      actionConfiguration.headers = [
        ...(actionConfiguration.headers?.filter((o) => o.key !== 'Cookie') ?? []),
        {
          key: 'Cookie',
          value: cookies.join('; ') + (cookieObj ? `;${cookieObj.value}` : '')
        }
      ];
    }

    let requestConfig = this.generateRequestConfig(actionConfiguration);
    // Always use POST for GraphQL since GET has limits on URL length
    requestConfig.method = HttpMethod.POST;
    requestConfig = { ...requestConfig, ...this.postRequestConfig(query ?? '', actionConfiguration) };

    const execOutput = await this.executeRequest(
      requestConfig,
      ActionResponseType.AUTO,
      actionConfiguration.verboseHttpOutput ?? false,
      true
    );

    const shouldFailOnGraphqlError = actionConfiguration.failOnGraphqlErrors ?? false;
    if (shouldFailOnGraphqlError && execOutput.output['errors'] !== undefined) {
      let errMsg = 'GraphQL request failed';
      if (execOutput.output['errors'].length > 0) {
        errMsg += `\nErrors:\n${JSON.stringify(execOutput.output['errors'], null, 2)}`;
      }

      throw new Error(errMsg);
    }

    return execOutput;
  }

  getRequest(actionConfiguration: GraphQLActionConfiguration, datasourceConfiguration: GraphQLDatasourceConfiguration): RawRequest {
    const mergedConfig = this.getMergedConfig(datasourceConfiguration, actionConfiguration);
    const bodyConfig = this.postRequestConfig(mergedConfig.body ?? '', mergedConfig).data;
    const body = isString(bodyConfig) ? bodyConfig : JSON.stringify(bodyConfig);
    return makeCurlString({
      reqMethod: HttpMethod.POST,
      reqUrl: mergedConfig.path,
      reqHeaders: mergedConfig.headers,
      reqBody: body
    });
  }

  private postRequestConfig(query: string, actionConfiguration: GraphQLActionConfiguration): { data: string | RequestConfig } {
    const requestConfig: { data: RequestConfig } = {
      data: {
        query
      }
    };

    const variables = actionConfiguration.custom?.variables?.value;
    // Checking for the nil case, as well as an empty string
    // as variables is persisted as an empty string when the field
    // is cleared out by a user in the UI
    if (!(_.isNil(variables) || variables === '')) {
      requestConfig.data.variables = JSON.parse(variables);
    }

    return requestConfig;
  }

  dynamicProperties(): string[] {
    return ['path', 'body', 'custom.variables.value', 'headers'];
  }

  escapeStringProperties(): string[] {
    return ['body'];
  }

  async metadata(datasourceConfiguration: GraphQLDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  async test(datasourceConfiguration: GraphQLDatasourceConfiguration): Promise<void> {
    return;
  }

  getMergedConfig(
    datasourceConfiguration: GraphQLDatasourceConfiguration,
    actionConfiguration: GraphQLActionConfiguration
  ): GraphQLActionConfiguration {
    const mergedConfig = { ...actionConfiguration };
    mergedConfig.path = datasourceConfiguration.path ?? actionConfiguration.path;
    mergedConfig.headers = (datasourceConfiguration.headers ?? []).concat(actionConfiguration.headers ?? []);
    return mergedConfig;
  }
}
