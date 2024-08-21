import { FormComponentType, InputDataType, IntegrationKind, Plugin, PluginResponseType, PluginType } from '../../../types';

export const AkeylessSecretsManagerVersions = {
  V1: '0.0.1'
};

export const AkeylessSecretsManagerPlugin: Plugin = {
  id: 'akeylesssecretsmanager',
  name: 'Akeyless Secrets Manager',
  moduleName: 'AkeylessSecretsManagerPlugin',
  modulePath: '',
  // TODO: docs
  iconLocation: 'https://superblocks.s3.us-west-2.amazonaws.com/img/integrations/akeyless.png',
  docsUrl: 'https://docs.superblocks.com/development-lifecycle/secrets/akeyless-secrets-manager',
  type: PluginType.DB,
  responseType: PluginResponseType.JSON,
  hasRawRequest: false,
  kind: IntegrationKind.SECRET,
  datasourceTemplate: {
    sections: [
      {
        name: 'main',
        items: [
          {
            label: '',
            name: 'provider.config.case',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            hidden: true,
            initialValue: 'akeylessSecretsManager'
          },
          {
            label: 'Address (optional)',
            name: 'provider.config.value.host',
            placeholder: 'https://api.akeyless.io',
            startVersion: AkeylessSecretsManagerVersions.V1,
            rules: [{ required: false }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText: 'The location of your Akeyless secrets. Defaults to https://api.akeyless.io'
            }
          },
          {
            label: 'Prefix (optional)',
            name: 'provider.config.value.prefix',
            placeholder: 'superblocks/production',
            startVersion: AkeylessSecretsManagerVersions.V1,
            rules: [{ required: false }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText:
                'If your secrets follow [hierarchical naming conventions](https://docs.akeyless.io/docs/folder-navigation-within-personal-corporate-areas-1), filter secrets in this store by this prefix. The prefix will be stripped when accessing the secret in Superblocks.'
            }
          }
        ]
      },
      {
        name: 'auth',
        items: [
          {
            label: 'Auth type',
            name: 'provider.config.value.auth.config.case',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.DROPDOWN,
            initialValue: 'apiKey',
            rules: [{ required: true }],
            options: [
              { displayName: 'API key', key: 'apiKey', value: 'apiKey' },
              { displayName: 'Email', key: 'email', value: 'email' }
            ]
          },
          {
            label: 'Access ID',
            name: 'provider.config.value.auth.config.value.accessId',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            rules: [{ required: true, message: 'Access ID is required' }],
            display: {
              show: { 'provider.config.value.auth.config.case': ['apiKey'] }
            }
          },
          {
            label: 'Access key',
            name: 'provider.config.value.auth.config.value.accessKey',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.PASSWORD,
            rules: [{ required: true, message: 'Access key is required' }],
            display: {
              show: { 'provider.config.value.auth.config.case': ['apiKey'] }
            }
          },
          {
            label: 'Email',
            name: 'provider.config.value.auth.config.value.email',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            rules: [{ required: true, message: 'Email is required' }],
            display: {
              show: { 'provider.config.value.auth.config.case': ['email'] }
            }
          },
          {
            label: 'Password',
            name: 'provider.config.value.auth.config.value.password',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.PASSWORD,
            rules: [{ required: true, message: 'Password is required' }],
            display: {
              show: { 'provider.config.value.auth.config.case': ['email'] }
            }
          }
        ]
      },
      {
        name: 'cache',
        items: [
          {
            label: 'Enable caching',
            name: 'cache',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.CHECKBOX,
            initialValue: true,
            tooltip: {
              markdownText: 'Superblocks will encrypt the secret values and cache them for the specified TTL'
            }
          },
          {
            label: 'Cache TTL (seconds)',
            name: 'ttl',
            startVersion: AkeylessSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.NUMBER,
            placeholder: 'ttl (i.e. 86400)',
            initialValue: 86400,
            rules: [
              {
                required: true,
                message: 'If caching is enabled, a TTL is required'
              }
            ],
            display: { show: { cache: ['true'] } },
            tooltip: {
              markdownText: 'When the TTL expires, the next execution will fetch the secret from the store'
            }
          }
        ]
      }
    ]
  },
  actionTemplate: { sections: [] }
};
