const { MOCK_OAUTH_SERVER_URL } = require('./utils');

const integrations = [
  {
    responseMeta: {
      status: 200,
      message: '',
      success: true,
    },
    data: {
      datasource: {
        id: 'rest-api-integration-id-pword',
        name: 'foobar',
        pluginId: 'restapiintegration',
        pluginName: 'REST API',
        organizationId: 'd285751e-664b-4e31-af7a-c4b11567cd46',
        demoIntegrationId: null,
        configurationStaging: {
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'None',
        },
        configurationProd: {
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'None',
        },
        configuration: {
          id: 'rest-api-integration-id-pword-default-config-id',
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'oauth-pword',
          authConfig: {
            clientId: 'clientid',
            clientSecret: 'clientsecret',
            audience: 'aud',
            tokenUrl: `${MOCK_OAUTH_SERVER_URL}/default/token`,
            useFixedPasswordCreds: true,
            username: 'username',
            password: 'password',
            tokenScope: 'user',
          },
        },
      },
      plugin: {
        id: 'restapiintegration',
      },
    },
  },
  {
    responseMeta: {
      status: 200,
      message: '',
      success: true,
    },
    data: {
      datasource: {
        id: 'rest-api-integration-id-code',
        name: 'foobar',
        pluginId: 'restapiintegration',
        pluginName: 'REST API',
        organizationId: 'd285751e-664b-4e31-af7a-c4b11567cd46',
        demoIntegrationId: null,
        configurationStaging: {
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'None',
        },
        configurationProd: {
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'None',
        },
        configuration: {
          id: 'rest-api-integration-id-code-default-config-id',
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'oauth-code',
          authConfig: {
            clientId: 'clientid',
            clientSecret: 'clientsecret',
            audience: 'aud',
            tokenUrl: `${MOCK_OAUTH_SERVER_URL}/default/token`,
          },
        },
      },
      plugin: {
        id: 'restapiintegration',
      },
    },
  },
  {
    responseMeta: {
      status: 200,
      message: '',
      success: true,
    },
    data: {
      datasource: {
        id: 'rest-api-integration-id-firebase',
        name: 'foobar',
        pluginId: 'restapiintegration',
        pluginName: 'REST API',
        organizationId: 'd285751e-664b-4e31-af7a-c4b11567cd46',
        demoIntegrationId: null,
        configurationStaging: {
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'None',
        },
        configurationProd: {
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'None',
        },
        configuration: {
          id: 'rest-api-integration-id-firebase-default-config-id',
          name: 'server api test 1687367988990',
          urlBase: 'awef',
          authType: 'Firebase',
          authConfig: {
            apiKey:
              '{apiKey: "AIzaSyBkhoJWYlFTy5_23djqCqcOlWK2jdT3xEM", projectId: "kareem-auth-test-1"}',
          },
        },
      },
      plugin: {
        id: 'restapiintegration',
      },
    },
  },
  {
    responseMeta: {
      status: 200,
      message: '',
      success: true,
    },
    data: {
      datasource: {
        id: 'kafka-integration-id-00001',
        name: 'foobar',
        pluginId: 'kafka',
        pluginName: 'REST API',
        organizationId: 'd285751e-664b-4e31-af7a-c4b11567cd46',
        demoIntegrationId: null,
        configuration: {
          cluster: {
            brokers: 'kafka:9092',
          },
        },
      },
      plugin: {
        id: 'kafka',
      },
    },
  },
  {
    responseMeta: {
      status: 200,
      message: '',
      success: true,
    },
    data: {
      datasource: {
        id: 'kafka-integration-id-00002',
        name: 'foobar',
        pluginId: 'kafka',
        pluginName: 'REST API',
        organizationId: 'd285751e-664b-4e31-af7a-c4b11567cd46',
        demoIntegrationId: null,
        configuration: {
          cluster: {
            brokers: 'mars:9092',
          },
        },
      },
      plugin: {
        id: 'kafka',
      },
    },
  },
  {
    responseMeta: {
      status: 200,
      message: '',
      success: true,
    },
    data: {
      datasource: {
        id: 'rest-integration-id-00001',
        name: 'foobar',
        pluginId: 'restapiintegration',
        pluginName: 'REST API',
        organizationId: 'd285751e-664b-4e31-af7a-c4b11567cd46',
        demoIntegrationId: null,
        configuration: {
          dynamicWorkflowConfiguration: {
            enabled: true,
            workflowId: '00000000-0000-0000-0000-000000000007',
          },
          authType: 'None',
          authConfig: {
            clientId: "{{ !(MyTestWorkflow.response.body.queryParamOne === 'queryParamOneDefaultValue') }}",
          },
        },
      },
      plugin: {
        id: 'restapiintegration',
      },
    },
  },
];

module.exports = integrations;
