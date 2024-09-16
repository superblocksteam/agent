import {
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  ExecutionOutput,
  HttpMethod,
  RestApiActionConfiguration,
  RestApiDatasourceConfiguration,
  PluginConfiguration,
  PluginExecutionProps,
  Property
} from '@superblocks/shared';
import { AxiosRequestConfig } from 'axios';
import RestApiPlugin from '.';

const plugin = new RestApiPlugin();
plugin.configure({
  restApiExecutionTimeoutMs: 5000,
  restApiMaxContentLengthBytes: 1000000
} as PluginConfiguration);

const actionConfiguration: RestApiActionConfiguration = {
  httpMethod: HttpMethod.GET,
  path: 'https://api.example.com/home',
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
  ] as Property[],
  ...DUMMY_ACTION_CONFIGURATION
};

describe('RestApiPlugin', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute calls executeRequest with expected params', () => {
    it.each([
      { name: 'verboseHTTP: true, doNotFailOnError: true', verboseOutput: true, doNotFailOnError: true, expectedOutput: true, expectedFailOnError: false },
      { name: 'verboseHTTP: false, doNotFailOnError: false', verboseOutput: false, doNotFailOnError: false, expectedOutput: false, expectedFailOnError: true },
      { name: 'verboseHTTP: undefined, doNotFailOnError: true', verboseOutput: undefined, doNotFailOnError: true, expectedOutput: false, expectedFailOnError: false },
      { name: 'verboseHTTP: undefined, doNotFailOnError: false', verboseOutput: undefined, doNotFailOnError: false, expectedOutput: false, expectedFailOnError: true },
      { name: 'verboseHTTP: undefined, doNotFailOnError: undefined', verboseOutput: undefined, doNotFailOnError: undefined, expectedOutput: false, expectedFailOnError: true }
    ])('called with $name', async ({ verboseOutput, doNotFailOnError, expectedOutput, expectedFailOnError }) => {
      const spy = jest.spyOn(plugin, 'executeRequest').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (requestConfig: AxiosRequestConfig<any>, responseType?: any, verboseOutput?: boolean): Promise<ExecutionOutput> => {
          return Promise.resolve(new ExecutionOutput());
        }
      );
      const datasourceConfiguration = {} as RestApiDatasourceConfiguration;

      const props: PluginExecutionProps<RestApiDatasourceConfiguration, RestApiActionConfiguration> = {
        context: DUMMY_EXECUTION_CONTEXT,
        actionConfiguration: {
          verboseHttpOutput: verboseOutput,
          doNotFailOnRequestError: doNotFailOnError,
          ...actionConfiguration
        },
        datasourceConfiguration,
        mutableOutput: new ExecutionOutput(),
        ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
      };

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
          url: 'https://api.example.com/home?param1=value1'
        },
        undefined,
        expectedOutput,
        expectedFailOnError
      );
    });
  });
});
