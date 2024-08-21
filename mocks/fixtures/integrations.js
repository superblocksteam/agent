module.exports = {
  PLUGIN: {
    'my-integration-one': {
      default: {
        endpoint: {
          host: 'postgres',
          port: 5432,
        },
        connection: {
          useSsl: false,
          useSelfSignedSsl: false,
        },
        authentication: {
          username: '{{ "post" }}{{ "gres"}}',
          password: 'password',
          custom: {
            databaseName: {
              value: 'postgres',
            },
          },
        },
      },
    },
  },
  SECRET: {
    'my-secret-mock-integration': {
      default: {
        provider: {
          mock: {
            data: {
              shhh: 'this is a secret',
            },
          },
        },
        configuration_id: 'c1',
        ttl: 50,
      },
    },
    'my-postgres-store': {
      default: {
        provider: {
          mock: {
            data: {
              password: 'password',
            },
          },
        },
        configuration_id: 'c2',
        ttl: 50,
      },
    },
  },
};
