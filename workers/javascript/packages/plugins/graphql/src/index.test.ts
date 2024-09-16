import {
  ActionResponseType,
  ExecutionOutput,
  GraphQLActionConfiguration,
  GraphQLDatasourceConfiguration,
  Property,
  RestApiActionConfiguration,
  RestApiDatasourceConfiguration,
  DUMMY_ACTION_CONFIGURATION,
  DUMMY_EXECUTION_CONTEXT,
  DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS,
  PluginConfiguration,
  PluginExecutionProps
} from '@superblocks/shared';
import { sample } from 'lodash';
import GraphQLPlugin from '.';

const plugin = new GraphQLPlugin();
plugin.configure({
  restApiExecutionTimeoutMs: 5000,
  restApiMaxContentLengthBytes: 1000000
} as PluginConfiguration);

const datasourceConfiguration = {
  urlBase: 'https://api.example.com/',
  headers: [
    {
      key: 'Cookie',
      value: 'value1'
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
} as GraphQLDatasourceConfiguration;

const actionConfiguration: GraphQLActionConfiguration = {
  path: 'https://api.example.com/home',
  headers: [
    {
      key: 'Authorization',
      value: 'Bearer {{token}}'
    }
  ] as Property[],
  ...DUMMY_ACTION_CONFIGURATION
};

describe('GraphQLPlugin', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute calls executeRequest ignoring params', () => {
    it.each([
      { name: 'verboseHTTP: true, failOnError: true', verboseOutput: true, failOnError: true, expectedOutput: true },
      { name: 'verboseHTTP: false, failOnError: false', verboseOutput: false, failOnError: false, expectedOutput: false },
      { name: 'verboseHTTP: undefined, failOnError: true', verboseOutput: undefined, failOnError: true, expectedOutput: false },
      { name: 'verboseHTTP: undefined, failOnError: false', verboseOutput: undefined, failOnError: false, expectedOutput: false },
      { name: 'verboseHTTP: undefined, failOnError: undefined', verboseOutput: undefined, failOnError: undefined, expectedOutput: false }
    ])('called with $name', async ({ verboseOutput, failOnError, expectedOutput }) => {
      const spy = jest.spyOn(plugin, 'executeRequest').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (requestConfig, responseType?: any, verboseOutput?: boolean): Promise<ExecutionOutput> => {
          return Promise.resolve(new ExecutionOutput());
        }
      );

      const props: PluginExecutionProps<RestApiDatasourceConfiguration, RestApiActionConfiguration> = {
        context: DUMMY_EXECUTION_CONTEXT,
        actionConfiguration: { verboseHttpOutput: verboseOutput, failOnGraphqlErrors: failOnError, ...actionConfiguration },
        datasourceConfiguration,
        mutableOutput: new ExecutionOutput(),
        ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
      };

      await plugin.execute(props);
      expect(spy).toHaveBeenCalledWith(
        {
          headers: {
            Authorization: 'Bearer {{token}}',
            Cookie: 'value1'
          },
          data: {
            query: 'select * from orders limit 1;'
          },
          method: 'POST',
          url: 'https://api.example.com/home'
        },
        ActionResponseType.AUTO,
        expectedOutput,
        true
      );
    });
  });

  describe('execute raises error when response has errors and failOnError is true', () => {
    const verboseOutputOptions = [true, false, undefined];

    it.each([
      { name: 'empty errors', verboseOutput: true, queryErrors: [] },
      { name: 'single error', verboseOutput: false, queryErrors: [{ message: 'SyntaxError' }] },
      { name: 'multiple errors', verboseOutput: undefined, queryErrors: [{ message: 'SyntaxError' }, { message: 'ValidationError' }] },
    ])('$name', async ({ verboseOutput, queryErrors }) => {
      const spy = jest.spyOn(plugin, 'executeRequest').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (requestConfig, responseType?: any, verboseOutput?: boolean): Promise<ExecutionOutput> => {
          const executionOutput = new ExecutionOutput();
          executionOutput.output = { errors: queryErrors };

          return Promise.resolve(executionOutput);
        }
      );

      const props: PluginExecutionProps<RestApiDatasourceConfiguration, RestApiActionConfiguration> = {
        context: DUMMY_EXECUTION_CONTEXT,
        actionConfiguration: { verboseHttpOutput: sample(verboseOutputOptions), failOnGraphqlErrors: true, ...actionConfiguration },
        datasourceConfiguration,
        mutableOutput: new ExecutionOutput(),
        ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
      };

      await expect(plugin.execute(props)).rejects.toThrowError();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('execute returns successfully when response has errors and failOnError is false or undefined', () => {
    const verboseOutputOptions = [true, false, undefined];

    it.each([
      { name: 'empty errors, fail on errors set', setFailOnErrors: true, queryErrors: [] },
      { name: 'empty errors, fail on errors undefined', setFailOnErrors: false, queryErrors: [] },
      { name: 'single error, fail on errors set', setFailOnErrors: true, queryErrors: [{ message: 'SyntaxError' }] },
      { name: 'single error, fail on errors undefined', setFailOnErrors: false, queryErrors: [{ message: 'SyntaxError' }] },
      { name: 'multiple errors, fail on errors set', setFailOnErrors: true, queryErrors: [{ message: 'SyntaxError' }, { message: 'ValidationError' }] },
      { name: 'multiple errors, fail on errors undefined', setFailOnErrors: false, queryErrors: [{ message: 'SyntaxError' }, { message: 'ValidationError' }] },
    ])('$name', async ({ setFailOnErrors, queryErrors }) => {
      const spy = jest.spyOn(plugin, 'executeRequest').mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (requestConfig, responseType?: any, verboseOutput?: boolean): Promise<ExecutionOutput> => {
          const executionOutput = new ExecutionOutput();
          executionOutput.output = { errors: queryErrors };

          return Promise.resolve(executionOutput);
        }
      );

      const props: PluginExecutionProps<RestApiDatasourceConfiguration, RestApiActionConfiguration> = {
        context: DUMMY_EXECUTION_CONTEXT,
        actionConfiguration: {
          verboseHttpOutput: sample(verboseOutputOptions),
          failOnGraphqlErrors: setFailOnErrors ? false : undefined,
          ...actionConfiguration
        },
        datasourceConfiguration,
        mutableOutput: new ExecutionOutput(),
        ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
      };

      const output: ExecutionOutput = await plugin.execute(props);

      expect(output.output).toBeDefined();
      expect(output.error).toBeUndefined();
      expect(spy).toHaveBeenCalled();
    });
  });
});
