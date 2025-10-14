import { DBSQLClient } from '@databricks/sql';
import { DatabricksDatasourceConfiguration } from '@superblocks/shared';
import { DatabricksPluginV1 } from '@superblocksteam/types';
import DatabricksPlugin from './index';

// mock the databricks client
jest.mock('@databricks/sql');

// Mock fetch for Unity Catalog API tests
global.fetch = jest.fn();

describe('DatabricksPlugin', () => {
  let plugin: DatabricksPlugin;
  let mockClient: jest.Mocked<DBSQLClient>;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // use fake timers to control setTimeout
    jest.useFakeTimers();
    plugin = new DatabricksPlugin();
    
    // Mock logger
    plugin.logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;
    
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
    mockFetch.mockClear();
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

  describe('Unity Catalog API Methods', () => {
    const baseUrl = 'https://test.databricks.com';
    const headers = { 'Authorization': 'Bearer test-token' };

    describe('fetchAllCatalogs', () => {
      test('should successfully fetch catalogs', async () => {
        const mockCatalogsResponse = {
          catalogs: [
            { name: 'catalog1' },
            { name: 'catalog2' }
          ]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCatalogsResponse)
        } as Response);

        const result = await (plugin as any).fetchAllCatalogs(baseUrl, headers);

        expect(mockFetch).toHaveBeenCalledWith(
          `${baseUrl}/api/2.1/unity-catalog/catalogs`,
          { method: 'GET', headers }
        );
        expect(result).toEqual(mockCatalogsResponse.catalogs);
      });

      test('should handle API error gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Unauthorized'
        } as Response);

        await expect((plugin as any).fetchAllCatalogs(baseUrl, headers))
          .rejects.toThrow('Failed to fetch catalogs: Unauthorized');
      });

      test('should return empty array when no catalogs', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        } as Response);

        const result = await (plugin as any).fetchAllCatalogs(baseUrl, headers);
        expect(result).toEqual([]);
      });
    });

    describe('fetchAllSchemas', () => {
      test('should successfully fetch schemas for catalogs', async () => {
        const catalogs = [{ name: 'catalog1' }, { name: 'catalog2' }];
        const mockSchemasResponse = {
          schemas: [
            { name: 'schema1', catalog_name: 'catalog1' },
            { name: 'schema2', catalog_name: 'catalog1' }
          ]
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockSchemasResponse)
        } as Response);

        const result = await (plugin as any).fetchAllSchemas(baseUrl, headers, catalogs);

        expect(mockFetch).toHaveBeenCalledTimes(2); // One call per catalog
        expect(result).toHaveLength(4); // 2 schemas per catalog
      });

      test('should handle individual schema fetch failures', async () => {
        const catalogs = [{ name: 'catalog1' }, { name: 'catalog2' }];

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              schemas: [{ name: 'schema1', catalog_name: 'catalog1' }]
            })
          } as Response)
          .mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found'
          } as Response);

        await expect((plugin as any).fetchAllSchemas(baseUrl, headers, catalogs))
          .rejects.toThrow('Failed to fetch schemas for catalog catalog2: Not Found');
      });
    });

    describe('fetchAllTablesWithColumns', () => {
      test('should successfully fetch tables with columns', async () => {
        const schemas = [
          { name: 'schema1', catalog_name: 'catalog1' },
          { name: 'schema2', catalog_name: 'catalog1' }
        ];
        
        const mockTablesResponse = {
          tables: [
            {
              name: 'table1',
              columns: [
                { name: 'id', type_name: 'INT' },
                { name: 'name', type_name: 'STRING' }
              ]
            }
          ]
        };

        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTablesResponse)
        } as Response);

        const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

        expect(mockFetch).toHaveBeenCalledTimes(2); // One call per schema
        expect(result).toHaveLength(2); // One table per schema
        expect(result[0].name).toBe('schema1.table1');
        expect(result[0].columns).toHaveLength(2);
      });

      test('should handle pagination in table responses', async () => {
        const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];
        
        // Mock first page
        const firstPageResponse = {
          tables: [
            { name: 'table1', columns: [{ name: 'id', type_name: 'INT' }] }
          ],
          next_page_token: 'token123'
        };
        
        // Mock second page
        const secondPageResponse = {
          tables: [
            { name: 'table2', columns: [{ name: 'name', type_name: 'STRING' }] }
          ]
        };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(firstPageResponse)
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(secondPageResponse)
          } as Response);

        const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

        expect(mockFetch).toHaveBeenCalledTimes(2); // First page + second page
        expect(result).toHaveLength(2); // Both tables from both pages
        expect(result[0].name).toBe('schema1.table1');
        expect(result[1].name).toBe('schema1.table2');
      });

      test('should handle schema fetch failures gracefully', async () => {
        const schemas = [
          { name: 'schema1', catalog_name: 'catalog1' },
          { name: 'schema2', catalog_name: 'catalog1' }
        ];

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              tables: [{ name: 'table1', columns: [] }]
            })
          } as Response)
          .mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found'
          } as Response);

        await expect((plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas))
          .rejects.toThrow('Failed to fetch tables for schema catalog1.schema2: Not Found');
      });

      test('should filter out unsupported table types', async () => {
        const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tables: [
              { name: 'managed_table', table_type: 'MANAGED', columns: [] },
              { name: 'external_table', table_type: 'EXTERNAL', columns: [] },
              { name: 'view_table', table_type: 'VIEW', columns: [] },
              { name: 'materialized_view_table', table_type: 'MATERIALIZED_VIEW', columns: [] },
              { name: 'unsupported_table', table_type: 'STREAMING_TABLE', columns: [] },
              { name: 'another_unsupported', table_type: 'FOREIGN', columns: [] },
              { name: 'no_type_table', columns: [] } // table without table_type should be included
            ]
          })
        } as Response);

        const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

        expect(result).toHaveLength(5); // Only allowed types + no type
        expect(result.map((t: any) => t.name)).toEqual([
          'schema1.managed_table',
          'schema1.external_table', 
          'schema1.view_table',
          'schema1.materialized_view_table',
          'schema1.no_type_table'
        ]);
      });
    });

    describe('getM2MAccessToken', () => {
      const mockDatasourceConfig: DatabricksDatasourceConfiguration = {
        name: 'test-databricks',
        connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
          hostUrl: 'test.databricks.com',
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
          oauthClientId: 'test-client-id',
          oauthClientSecret: 'test-client-secret'
        })
      };

      test('should successfully get M2M access token', async () => {
        const mockTokenResponse = {
          access_token: 'new-access-token',
          token_type: 'Bearer'
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        } as Response);

        const result = await (plugin as any).getM2MAccessToken(baseUrl, mockDatasourceConfig);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test.databricks.com/oidc/v1/token',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })
        );
        expect(result).toBe('new-access-token');
      });

      test('should handle M2M OAuth API error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: 'Bad Request'
        } as Response);

        await expect((plugin as any).getM2MAccessToken(baseUrl, mockDatasourceConfig))
          .rejects.toThrow('Failed to get an access token for machine-to-machine, received a status: 400 - Bad Request');
      });

      test('should handle missing access_token in response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        } as Response);

        await expect((plugin as any).getM2MAccessToken(baseUrl, mockDatasourceConfig))
          .rejects.toThrow('Failed to find access token in OAuth response');
      });

      test('should throw error when client ID is missing', async () => {
        const configMissingClientId: DatabricksDatasourceConfiguration = {
          name: 'test-databricks',
          connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
            hostUrl: 'test.databricks.com',
            connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
            oauthClientSecret: 'test-client-secret'
            // Missing oauthClientId
          })
        };

        await expect((plugin as any).getM2MAccessToken(baseUrl, configMissingClientId))
          .rejects.toThrow('M2M authentication requires oauthClientId and oauthClientSecret');
      });

      test('should throw error when client secret is missing', async () => {
        const configMissingClientSecret: DatabricksDatasourceConfiguration = {
          name: 'test-databricks',
          connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
            hostUrl: 'test.databricks.com',
            connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
            oauthClientId: 'test-client-id'
            // Missing oauthClientSecret
          })
        };

        await expect((plugin as any).getM2MAccessToken(baseUrl, configMissingClientSecret))
          .rejects.toThrow('M2M authentication requires oauthClientId and oauthClientSecret');
      });

      test('should include scope in token request', async () => {
        const mockTokenResponse = { access_token: 'test-token' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse)
        } as Response);

        await (plugin as any).getM2MAccessToken(baseUrl, mockDatasourceConfig);

        const fetchCall = mockFetch.mock.calls[0];
        const requestBody = fetchCall[1]?.body as string;
        
        expect(requestBody).toContain('scope=all-apis');
        expect(requestBody).toContain('grant_type=client_credentials');
        expect(requestBody).toContain('client_id=test-client-id');
        expect(requestBody).toContain('client_secret=test-client-secret');
      });

      test('should handle JSON parsing error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        } as Response);

        await expect((plugin as any).getM2MAccessToken(baseUrl, mockDatasourceConfig))
          .rejects.toThrow('Invalid JSON');
      });
    });
  });

  describe('metadata method', () => {
    const mockDatasourceConfig: DatabricksDatasourceConfiguration = {
      name: 'test-databricks',
      connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
        hostUrl: 'test.databricks.com',
        token: 'test-token',
        connectionType: DatabricksPluginV1.Plugin_ConnectionType.OAUTH_EXCHANGE
      }),
      authConfig: {
        authToken: 'oauth-exchange-token'
      }
    };

    test('should successfully fetch metadata using Unity Catalog APIs', async () => {
      // Mock catalogs response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          catalogs: [{ name: 'main' }]
        })
      } as Response);

      // Mock schemas response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          schemas: [{ name: 'default', catalog_name: 'main' }]
        })
      } as Response);

      // Mock tables response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type_name: 'INT' },
                { name: 'email', type_name: 'STRING' }
              ]
            }
          ]
        })
      } as Response);

      const result = await plugin.metadata(mockDatasourceConfig);

      expect(result.dbSchema?.tables).toHaveLength(1);
      expect(result.dbSchema?.tables[0].name).toBe('default.users');
      expect(result.dbSchema?.tables[0].schema).toBe('main');
      expect(result.dbSchema?.tables[0].columns).toHaveLength(2);
      expect(result.dbSchema?.schemas).toHaveLength(1);
      expect(result.dbSchema?.schemas[0].name).toBe('main');
    });

    test('should handle M2M authentication flow', async () => {
      const m2mConfig: DatabricksDatasourceConfiguration = {
        name: 'test-databricks',
        connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
          hostUrl: 'test.databricks.com',
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.M2M,
          oauthClientId: 'test-client-id',
          oauthClientSecret: 'test-client-secret'
        })
      };

      // Mock M2M token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'm2m-token' })
      } as Response);

      // Mock catalogs response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ catalogs: [{ name: 'test' }] })
      } as Response);

      // Mock schemas response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schemas: [{ name: 'default', catalog_name: 'test' }] })
      } as Response);

      // Mock tables response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tables: [] })
      } as Response);

      const result = await plugin.metadata(m2mConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.databricks.com/oidc/v1/token',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.dbSchema?.tables).toEqual([]);
    });

    test('should handle PAT authentication flow', async () => {
      const patConfig: DatabricksDatasourceConfiguration = {
        name: 'test-databricks',
        connection: new DatabricksPluginV1.Plugin_DatabricksConnection({
          hostUrl: 'test.databricks.com',
          token: 'pat-token',
          connectionType: DatabricksPluginV1.Plugin_ConnectionType.PAT
        })
      };

      // Mock catalogs response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ catalogs: [{ name: 'main' }] })
      } as Response);

      // Mock schemas response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ schemas: [] })
      } as Response);

      const result = await plugin.metadata(patConfig);

      expect(result.dbSchema?.tables).toEqual([]);
      expect(result.dbSchema?.schemas).toEqual([]);
    });

    test('should filter out schemas with no tables', async () => {
      // Mock catalogs response - 2 catalogs
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          catalogs: [{ name: 'catalog1' }, { name: 'catalog2' }]
        })
      } as Response);

      // Mock schemas response - both catalogs have schemas
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            schemas: [{ name: 'schema1', catalog_name: 'catalog1' }]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            schemas: [{ name: 'schema2', catalog_name: 'catalog2' }]
          })
        } as Response);

      // Mock tables response - only first schema has tables
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tables: [{ name: 'table1', columns: [] }]
          })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            tables: [] // Empty tables for second schema
          })
        } as Response);

      const result = await plugin.metadata(mockDatasourceConfig);

      // Should only include catalog1 since catalog2 has no tables
      expect(result.dbSchema?.schemas).toHaveLength(1);
      expect(result.dbSchema?.schemas[0].name).toBe('catalog1');
      expect(result.dbSchema?.tables).toHaveLength(1);
    });

    test('should handle catalog fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized'
      } as Response);

      await expect(plugin.metadata(mockDatasourceConfig))
        .rejects.toThrow('Failed to connect to Databricks');
    });

    test('should handle schema fetch failure', async () => {
      // Mock successful catalogs response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          catalogs: [{ name: 'main' }]
        })
      } as Response);

      // Mock failed schemas response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Forbidden'
      } as Response);

      await expect(plugin.metadata(mockDatasourceConfig))
        .rejects.toThrow('Failed to connect to Databricks');
    });

    test('should handle table fetch failure', async () => {
      // Mock successful catalogs response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          catalogs: [{ name: 'main' }]
        })
      } as Response);

      // Mock successful schemas response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          schemas: [{ name: 'default', catalog_name: 'main' }]
        })
      } as Response);

      // Mock failed tables response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      await expect(plugin.metadata(mockDatasourceConfig))
        .rejects.toThrow('Failed to connect to Databricks');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(plugin.metadata(mockDatasourceConfig))
        .rejects.toThrow('Failed to connect to Databricks');
    });

    test('should handle empty catalogs response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ catalogs: [] })
      } as Response);

      const result = await plugin.metadata(mockDatasourceConfig);

      expect(result.dbSchema?.tables).toEqual([]);
      expect(result.dbSchema?.schemas).toEqual([]);
    });
  });

  describe('Column and Data Type Handling', () => {
    const baseUrl = 'https://test.databricks.com';
    const headers = { 'Authorization': 'Bearer test-token' };

    test('should handle columns with type_name field', async () => {
      const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tables: [
            {
              name: 'table1',
              columns: [
                { name: 'id', type_name: 'BIGINT' },
                { name: 'name', type_name: 'STRING' }
              ]
            }
          ]
        })
      } as Response);

      const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

      expect(result[0].columns[0].type).toBe('BIGINT');
      expect(result[0].columns[1].type).toBe('STRING');
    });

    test('should handle columns with data_type field as fallback', async () => {
      const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tables: [
            {
              name: 'table1',
              columns: [
                { name: 'id', data_type: 'INTEGER' },
                { name: 'created_at', data_type: 'TIMESTAMP' }
              ]
            }
          ]
        })
      } as Response);

      const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

      expect(result[0].columns[0].type).toBe('INTEGER');
      expect(result[0].columns[1].type).toBe('TIMESTAMP');
    });

    test('should handle columns with both type_name and data_type (prefer type_name)', async () => {
      const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tables: [
            {
              name: 'table1',
              columns: [
                { name: 'id', type_name: 'BIGINT', data_type: 'INTEGER' }
              ]
            }
          ]
        })
      } as Response);

      const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

      expect(result[0].columns[0].type).toBe('BIGINT'); // Should prefer type_name
    });

    test('should handle tables with no columns', async () => {
      const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tables: [
            { name: 'empty_table' } // No columns field
          ]
        })
      } as Response);

      const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

      expect(result[0].columns).toHaveLength(0);
      expect(result[0].name).toBe('schema1.empty_table');
    });

    test('should handle tables with empty columns array', async () => {
      const schemas = [{ name: 'schema1', catalog_name: 'catalog1' }];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          tables: [
            { name: 'empty_table', columns: [] }
          ]
        })
      } as Response);

      const result = await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

      expect(result[0].columns).toHaveLength(0);
      expect(result[0].name).toBe('schema1.empty_table');
    });
  });

  describe('Batching and Concurrency', () => {
    const baseUrl = 'https://test.databricks.com';
    const headers = { 'Authorization': 'Bearer test-token' };

    test('should process catalogs in batches', async () => {
      // Create 15 catalogs to test batching (CONCURRENCY = 10)
      const catalogs = Array.from({ length: 15 }, (_, i) => ({ name: `catalog${i + 1}` }));
      
      // Mock all schema responses
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ schemas: [] })
        } as Response)
      );

      await (plugin as any).fetchAllSchemas(baseUrl, headers, catalogs);

      // Should make 15 API calls (one per catalog)
      expect(mockFetch).toHaveBeenCalledTimes(15);
    });

    test('should process schemas in batches', async () => {
      // Create 25 schemas to test batching (CONCURRENCY = 10)  
      const schemas = Array.from({ length: 25 }, (_, i) => ({ 
        name: `schema${i + 1}`, 
        catalog_name: 'catalog1' 
      }));
      
      // Mock all table responses
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tables: [] })
        } as Response)
      );

      await (plugin as any).fetchAllTablesWithColumns(baseUrl, headers, schemas);

      // Should make 25 API calls (one per schema)
      expect(mockFetch).toHaveBeenCalledTimes(25);
    });
  });
});
