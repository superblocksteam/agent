import {
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  ExecutionOutput,
  HttpMethod,
  PluginConfiguration,
  PluginExecutionProps,
  Property,
  RestApiIntegrationActionConfiguration,
  RestApiIntegrationDatasourceConfiguration,
  SUPERBLOCKS_OPENAPI_TENANT_KEYWORD
} from '@superblocks/shared';
import { AxiosRequestConfig } from 'axios';
import RestApiIntegrationPlugin from '.';

const plugin = new RestApiIntegrationPlugin();
plugin.configure({
  restApiExecutionTimeoutMs: 5000,
  restApiMaxContentLengthBytes: 1000000
} as PluginConfiguration);

const datasourceConfiguration = {
  urlBase: 'https://api.example.com/',
  headers: [
    {
      key: 'Authorization',
      value: 'Bearer {{token}}'
    }
  ] as Property[],
  params: [
    {
      key: 'param1',
      value: 'value1'
    },
    {
      key: 'param2',
      value: ''
    }
  ] as Property[]
} as RestApiIntegrationDatasourceConfiguration;

const props: PluginExecutionProps<RestApiIntegrationDatasourceConfiguration, RestApiIntegrationActionConfiguration> = {
  context: DUMMY_EXECUTION_CONTEXT,
  actionConfiguration: { httpMethod: HttpMethod.GET, ...DUMMY_ACTION_CONFIGURATION },
  datasourceConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

describe('RestApiIntegrationPlugin', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('execute removes empty params', async () => {
    const spy = jest.spyOn(plugin, 'executeRequest').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises
      (requestConfig: AxiosRequestConfig<any>, responseType?: any): Promise<ExecutionOutput> => {
        return Promise.resolve(new ExecutionOutput());
      }
    );

    await plugin.execute(props);
    expect(spy).toHaveBeenCalledWith(
      {
        headers: {
          Authorization: 'Bearer {{token}}',
          'User-Agent': 'superblocks restapi'
        },
        maxBodyLength: 1000000,
        maxContentLength: 1000000,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000,
        url: 'https://api.example.com/?param1=value1'
      },
      undefined
    );
  });

  it('execute injects placeholder URL with tenant subdomain', async () => {
    const spy = jest.spyOn(plugin, 'executeRequest').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises
      (requestConfig: AxiosRequestConfig<any>, responseType?: any): Promise<ExecutionOutput> => {
        return Promise.resolve(new ExecutionOutput());
      }
    );

    const tenantDatasourceConfiguration = {
      urlBase: `https://${SUPERBLOCKS_OPENAPI_TENANT_KEYWORD}.example.com/`,
      openApiTenantName: 'sb-tenant',
      headers: [
        {
          key: 'Authorization',
          value: 'Bearer {{token}}'
        }
      ] as Property[],
      params: [
        {
          key: 'param1',
          value: 'value1'
        },
        {
          key: 'param2',
          value: ''
        }
      ] as Property[]
    } as RestApiIntegrationDatasourceConfiguration;

    const tenantProps: PluginExecutionProps<RestApiIntegrationDatasourceConfiguration, RestApiIntegrationActionConfiguration> = {
      context: DUMMY_EXECUTION_CONTEXT,
      actionConfiguration: { httpMethod: HttpMethod.GET, ...DUMMY_ACTION_CONFIGURATION },
      datasourceConfiguration: tenantDatasourceConfiguration,
      mutableOutput: new ExecutionOutput(),
      ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
    };

    await plugin.execute(tenantProps);
    expect(spy).toHaveBeenCalledWith(
      {
        headers: {
          Authorization: 'Bearer {{token}}',
          'User-Agent': 'superblocks restapi'
        },
        maxBodyLength: 1000000,
        maxContentLength: 1000000,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000,
        url: 'https://sb-tenant.example.com/?param1=value1'
      },
      undefined
    );
  });

  it('test method executes without error', async () => {
    const spy = jest
      .spyOn(plugin, 'executeRequest')
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .mockImplementation((requestConfig: AxiosRequestConfig<unknown>, responseType?: unknown): Promise<ExecutionOutput> => {
        return Promise.resolve(new ExecutionOutput());
      });

    await plugin.test(datasourceConfiguration, { httpMethod: HttpMethod.GET, urlPath: 'test' });

    expect(spy).toHaveBeenCalledWith(
      {
        headers: {
          Authorization: 'Bearer {{token}}',
          'User-Agent': 'superblocks restapi'
        },
        maxBodyLength: 1000000,
        maxContentLength: 1000000,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 5000,
        url: 'https://api.example.com/test?param1=value1'
      },
      undefined
    );
  });
});
