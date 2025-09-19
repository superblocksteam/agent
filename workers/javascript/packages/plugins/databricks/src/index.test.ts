import { DBSQLClient } from '@databricks/sql';
import { DatabricksDatasourceConfiguration } from '@superblocks/shared';
import { DatabricksPluginV1 } from '@superblocksteam/types';
import DatabricksPlugin from './index';

// mock the databricks client
jest.mock('@databricks/sql');

describe('DatabricksPlugin', () => {
  let plugin: DatabricksPlugin;
  let mockClient: jest.Mocked<DBSQLClient>;

  beforeEach(() => {
    // use fake timers to control setTimeout
    jest.useFakeTimers();
    plugin = new DatabricksPlugin();
    mockClient = new DBSQLClient() as jest.Mocked<DBSQLClient>;

    // setup default mocks
    mockClient.on = jest.fn();
    mockClient.connect = jest.fn();
    mockClient.openSession = jest.fn();
    mockClient.close = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('test connection timeout', () => {
    const mockDatasourceConfig: DatabricksDatasourceConfiguration = {
      name: 'test-databricks',
      connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
        hostUrl: 'https://test.databricks.com',
        path: '/sql/1.0/warehouses/test',
        token: 'test-token'
      })
    };

    test('should timeout after 5000ms and raise exception', async () => {
      // spy on createConnection to hang indefinitely
      jest.spyOn(plugin, 'createConnection' as any).mockImplementation(
        () =>
          new Promise(() => {
            // never resolve to simulate connection timeout
          })
      );

      // start the test call (don't await yet)
      const testPromise = plugin.test(mockDatasourceConfig);

      // advance timers by 5000ms to trigger the timeout
      jest.advanceTimersByTime(5000);

      // now await the result
      await expect(testPromise).rejects.toThrow('IntegrationTimeoutError: Failed to connect to warehouse. Connection timeout after 5000ms');
    });

    test('should fail immediately when query execution throws error', async () => {
      // mock connection to succeed
      mockClient.connect.mockResolvedValue(undefined);
      mockClient.close.mockResolvedValue(undefined);

      // mock executeQuery to throw an error immediately
      const testError = new Error('connection refused');
      jest.spyOn(plugin, 'executeQuery' as any).mockRejectedValue(testError);

      // spy on createConnection to return our mocked client
      jest.spyOn(plugin, 'createConnection' as any).mockResolvedValue(mockClient);

      await expect(plugin.test(mockDatasourceConfig)).rejects.toThrow('Test Databricks connection failed: connection refused');

      // verify client close was called (cleanup in finally block)
      expect(mockClient.close).toHaveBeenCalled();
    });
  });
});
