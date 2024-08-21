import { FormComponentType, InputDataType, IntegrationKind, Plugin, PluginResponseType, PluginType } from '../../../types';

export const HashicorpVaultVersions = {
  V1: '0.0.1'
};

export const HashicorpVaultPlugin: Plugin = {
  id: 'hashicorpvault',
  name: 'HashiCorp Vault',
  moduleName: 'HashicorpVaultPlugin',
  modulePath: '',
  iconLocation: 'https://superblocks.s3.us-west-2.amazonaws.com/img/integrations/hashicorpvault.png',
  docsUrl: 'https://docs.superblocks.com/development-lifecycle/secrets/hashicorp-vault',
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
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            hidden: true,
            initialValue: 'hashicorpVault'
          },
          {
            label: 'Address',
            name: 'provider.config.value.address',
            placeholder: 'https://my-public-vault-1234.6789.z6.hashicorp.cloud:8200',
            startVersion: HashicorpVaultVersions.V1,
            rules: [{ required: true, message: 'The address to your vault is required' }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText: 'The location of your Hashicorp Vault instance'
            }
          },
          {
            label: 'Namespace (optional)',
            name: 'provider.config.value.namespace',
            placeholder: 'admin',
            startVersion: HashicorpVaultVersions.V1,
            rules: [{ required: false }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText:
                'An optional Hashicorp Vault namespace [Read More](https://developer.hashicorp.com/vault/docs/enterprise/namespaces)'
            }
          },
          // TODO: the secrets engine path below is marked as required = false, but this is always needed ?
          //       can we mark this as required without making this breaking?
          {
            label: 'Secrets engine path',
            name: 'provider.config.value.path',
            placeholder: 'superblocks/production',
            startVersion: HashicorpVaultVersions.V1,
            rules: [{ required: false }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText: 'The path of the secrets engine to use [Read More](https://developer.hashicorp.com/vault/docs/secrets)'
            }
          },
          {
            label: 'Secrets path (optional)',
            name: 'provider.config.value.secretsPath',
            placeholder: 'applications/app_foo',
            startVersion: HashicorpVaultVersions.V1,
            rules: [{ required: false }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText: 'The path to the secrets'
            }
          },
          {
            label: 'Version',
            name: 'provider.config.value.version',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.DROPDOWN,
            initialValue: 'VERSION_V2',
            rules: [{ required: true }],
            tooltip: {
              markdownText:
                'The Hashicorp Vault engine version [Read More](https://support.hashicorp.com/hc/en-us/articles/4404288741139-Which-Version-is-my-Vault-KV-Mount).'
            },
            // I think we messed up here and key should be an int of the enum
            // we will have to fix this somehow without introducing a breaking change
            options: [
              {
                key: 'VERSION_V1',
                value: 'VERSION_V1',
                displayName: 'V1'
              },
              {
                key: 'VERSION_V2',
                value: 'VERSION_V2',
                displayName: 'V2'
              }
            ]
          }
        ]
      },
      {
        name: 'auth',
        items: [
          {
            label: '',
            name: 'provider.config.case',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            hidden: true,
            initialValue: 'hashicorpVault'
          },
          {
            label: 'Auth type',
            name: 'provider.config.value.auth.config.case',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.DROPDOWN,
            initialValue: 'appRole',
            rules: [{ required: true }],
            options: [
              {
                displayName: 'App role',
                key: 'appRole',
                value: 'appRole'
              },
              {
                displayName: 'Token',
                key: 'token',
                value: 'token'
              }
            ]
          },
          {
            label: 'Token',
            name: 'provider.config.value.auth.config.value',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.PASSWORD,
            rules: [{ required: true, message: 'Token is required' }],
            display: {
              show: {
                'provider.config.value.auth.config.case': ['token']
              }
            },
            tooltip: {
              markdownText: 'Token authentication is considered insecure.'
            }
          },
          {
            label: 'Role ID',
            name: 'provider.config.value.auth.config.value.roleId',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            rules: [{ required: true, message: 'Role ID is required' }],
            display: {
              show: {
                'provider.config.value.auth.config.case': ['appRole']
              }
            }
          },
          {
            label: 'Secret ID',
            name: 'provider.config.value.auth.config.value.secretId',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.PASSWORD,
            rules: [{ required: true, message: 'Secret ID is required' }],
            display: {
              show: {
                'provider.config.value.auth.config.case': ['appRole']
              }
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
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.CHECKBOX,
            initialValue: true,
            tooltip: {
              markdownText: 'Superblocks will encrypt the secret values and cache them for the specified TTL'
            }
          },
          {
            label: 'Cache TTL (seconds)',
            name: 'ttl',
            startVersion: HashicorpVaultVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.NUMBER,
            placeholder: 'ttl (i.e. 86400)',
            initialValue: 86400,
            rules: [{ required: true, message: 'If caching is enabled, a TTL is required' }],
            display: {
              show: {
                cache: ['true']
              }
            },
            tooltip: {
              markdownText: 'When the TTL expires, the next execution will fetch the secret from the store'
            }
          }
        ]
      }
    ]
  },
  actionTemplate: {
    sections: []
  }
};
