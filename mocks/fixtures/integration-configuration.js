const integrationConfigurations = [
  {
    api: {
      metadata: {
        id: '00000000-0000-0000-0000-000000000005',
      },
    },
    realResponse: {
      responseMeta: {
        status: 200,
        message: '',
        success: true,
      },
      data: {
        id: '00000000-0000-0000-0000-000000000005',
        created: '2023-04-27T17:34:20.629Z',
        updated: '2023-04-27T17:34:20.629Z',
        name: 'Foo Name',
        pluginId: 'postgres',
        organizationId: '00000000-0000-0000-0000-000000000006',
        demoIntegrationId: null,
        configurations: [
          {
            id: '00000000-0000-0000-0000-000000000007',
            created: '2023-04-27T17:34:20.629Z',
            integrationId: '00000000-0000-0000-0000-000000000008',
            configuration: {
              name: 'Config 1',
              endpoint: {
                host: 'postgres',
                port: '5432',
              },
              connection: {
                useSsl: false,
              },
              authentication: {
                custom: {
                  databaseName: {
                    value: 'postgres',
                  },
                },
                password: 'password',
                username: 'postgres',
              },
              superblocksMetadata: {
                pluginVersion: '0.0.10',
              },
            },
            isDefault: true,
            profileIds: [
              '00000000-0000-0000-0000-000000000009',
              '00000000-0000-0000-0000-000000000010',
            ],
          },
          {
            id: '00000000-0000-0000-0000-000000000011',
            created: '2023-04-27T17:34:20.629Z',
            integrationId: '00000000-0000-0000-0000-000000000012',
            configuration: {
              name: 'Config 2',
              endpoint: {
                host: 'postgres',
                port: '5432',
              },
              connection: {
                useSsl: false,
              },
              authentication: {
                custom: {
                  databaseName: {
                    value: 'postgres',
                  },
                },
                password: 'password',
                username: 'postgres',
              },
              superblocksMetadata: {
                pluginVersion: '0.0.10',
              },
            },
            isDefault: true,
            profileIds: [
              '00000000-0000-0000-0000-000000000013',
              '00000000-0000-0000-0000-000000000014',
            ],
          },
        ],
        isUserConfigured: true,
      },
    },
  },
];

module.exports = integrationConfigurations;
