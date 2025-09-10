import {
  ApiKeyMethod,
  DropdownOption,
  EditorLanguage,
  ExtendedIntegrationPluginId,
  FormComponentType,
  FormItem,
  FormSection,
  getDisplayName,
  GoogleSheetsAuthType,
  InputDataType,
  IntegrationAuthType,
  NewAuthType,
  OAUTH_CALLBACK_PATH,
  TokenScope
} from '../../../types';
import { RestApiIntegrationPluginVersions } from './restapiintegration';

// ApiKeyFormItem describes how to create an input for the user to
// enter a token.
// E.g. to send a token to CircleCI it would be configured as:
//   {label: "Token", header: "Circle-Token"}.
//
// This would send the following header in the request:
//   Circle-Token: <token-value>
type ApiKeyFormItem = {
  label: string; // The label for the form
  header: string; // The HTTP header key
  key: string; // Unique key for the form
  required?: boolean; // Whether the field is required
  valuePrefix?: string; // A string that should be prefixed to the value
};

type BasicAuthConfig = {
  label?: string;
  placeholder?: string;
};

export enum ClientAuthMethod {
  POST = 'POST',
  BASIC = 'BASIC'
}

export type AuthMethods = {
  basic?: boolean | { username?: BasicAuthConfig; password?: BasicAuthConfig };
  firebase?: boolean;
  oauth?: boolean;
  bearer?: boolean;
  apiKey?: boolean;
  apiKeyForm?: ApiKeyFormItem[];
  tokenPrefixed?: boolean | { prefix: string };
  oauth2BringYourOwn?: OAuth2Config;
  oauth2SuperblocksClient?: OAuth2HostedClientConfig;
  // controls proto defined auth components
  passwordGrantFlow?: boolean;
  authorizationCodeFlow?: boolean;
  clientCredentialsFlow?: boolean;
};

export type AuthorizationStateConfig = 'datasource-auth-state'; // TODO: Can also add config to exclude the one-time-code if needed.

export type AuthorizationExtraParams = {
  responseType?: string;
  accessType?: string;
  stateConfigExclude?: AuthorizationStateConfig[];
  owner?: string;
};

type OAuth2Config = {
  tokenUrl: string;
  authorizationUrl: string;
  revokeTokenUrl: string;
  clientAuthMethod?: ClientAuthMethod;
  userInfoUrl?: string;
  authorizationExtraParams?: AuthorizationExtraParams;
  iconUrl: string;
};

type OAuth2HostedClientConfig = OAuth2Config & { clientId: string };

const AUTH_METHODS_TO_TYPES = {
  basic: IntegrationAuthType.BASIC,
  firebase: IntegrationAuthType.FIREBASE,
  oauth: IntegrationAuthType.OAUTH2_CLIENT_CREDS,
  bearer: IntegrationAuthType.BEARER,
  apiKey: IntegrationAuthType.API_KEY,
  apiKeyForm: IntegrationAuthType.API_KEY_FORM,
  tokenPrefixed: IntegrationAuthType.TOKEN_PREFIXED,
  oauth2BringYourOwn: IntegrationAuthType.OAUTH2_CODE,
  oauth2SuperblocksClient: IntegrationAuthType.OAUTH2_CODE,
  // those matches proto types auth.method.case
  passwordGrantFlow: NewAuthType.OAUTH2_PASSWORD_GRANT_FLOW,
  authorizationCodeFlow: NewAuthType.OAUTH2_AUTH_CODE_FLOW,
  clientCredentialsFlow: NewAuthType.OAUTH2_CLIENT_CREDS_FLOW
};

export const authSections = ({
  startVersion,
  pluginId,
  pluginName,
  defaultMethod,
  enabledMethods,
  allowNone = true,
  fieldNamesToHide = [],
  isProto = false,
  // allow caller to provide optional customized auth items
  prependItems = []
}: {
  startVersion: string;
  pluginId: ExtendedIntegrationPluginId;
  pluginName: string;
  enabledMethods: AuthMethods;
  defaultMethod?: string;
  allowNone?: boolean;
  fieldNamesToHide?: string[];
  isProto?: boolean;
  prependItems?: FormItem[];
}): FormSection[] => {
  // Filter out any disabled methods
  enabledMethods = Object.keys(enabledMethods).reduce((acc: AuthMethods, key: string) => {
    if (enabledMethods[key]) {
      acc[key] = enabledMethods[key];
    }
    return acc;
  }, {});

  // If there are no enabled methods, return an empty array
  const enabledMethodKeys = Object.keys(enabledMethods);
  if (enabledMethodKeys.length === 0) {
    return [];
  }

  let authTypeInitialValue;
  // If default method is specified and it's enabled, use it. Otherwise, if allowNone is true, use none. Otherwise, use the first enabled method.
  if (defaultMethod && enabledMethods[defaultMethod]) {
    authTypeInitialValue = AUTH_METHODS_TO_TYPES[defaultMethod];
  } else if (allowNone) {
    authTypeInitialValue = IntegrationAuthType.NONE;
  } else {
    authTypeInitialValue = AUTH_METHODS_TO_TYPES[enabledMethodKeys[0]];
  }

  if (!authTypeInitialValue) {
    throw new Error(
      `Could not determine initial auth type for plugin ${pluginId} given default method ${defaultMethod} and enabled methods ${enabledMethodKeys}`
    );
  }

  const formSections: FormSection[] = [];
  const authFields: FormItem[] = [];
  addField(authFields, prependItems, fieldNamesToHide);

  // oauth2SuperblocksClient is google sheet
  // google sheet defines Authentication dropdown at parent level gsheets.ts
  if (!enabledMethods.oauth2SuperblocksClient) {
    addField(
      authFields,
      [
        {
          name: isProto ? 'connection.auth.method.case' : 'authType',
          label: 'Authentication',
          startVersion: startVersion,
          componentType: FormComponentType.DROPDOWN,
          initialValue: authTypeInitialValue,
          options: authTypeOptions({ enabledMethods, allowNone, isProto }),
          disabled: !allowNone && enabledMethodKeys.length === 1
        }
      ],
      fieldNamesToHide
    );
  }

  if (enabledMethods.basic) {
    let usernameLabel = 'Username';
    let usernamePlaceholder = 'username';
    let passwordLabel = 'Password';
    let passwordPlaceholder = 'password';
    if (typeof enabledMethods.basic === 'object' && enabledMethods.basic.username) {
      usernameLabel = enabledMethods.basic.username.label ?? usernameLabel;
      usernamePlaceholder = enabledMethods.basic.username.placeholder ?? usernamePlaceholder;
    }
    if (typeof enabledMethods.basic === 'object' && enabledMethods.basic.password) {
      passwordLabel = enabledMethods.basic.password.label ?? passwordLabel;
      passwordPlaceholder = enabledMethods.basic.password.placeholder ?? passwordPlaceholder;
    }
    addField(
      authFields,
      [
        {
          label: 'Share username/password across all users',
          // Explicitly use a different var from useFixedPasswordCreds since
          // this is semantically pretty different for this auth type. They
          // default to opposite values for example.
          name: 'authConfig.shareBasicAuthCreds',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          tooltip: {
            markdownText: `When enabled, all users will share a fixed set of
      credentials. When disabled, users will be prompted to enter a
      username/password to authenticate themselves with this integration.`
          },
          display: {
            show: {
              authType: [IntegrationAuthType.BASIC]
            }
          },
          initialValue: true
        },
        {
          label: usernameLabel,
          name: 'authConfig.username',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          placeholder: usernamePlaceholder,
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.BASIC],
              // Adding undefined is a bit of a hack here to show this field
              // when the default value is set. This will be removed soon.
              'authConfig.shareBasicAuthCreds': ['true', 'undefined']
            }
          }
        },
        {
          label: passwordLabel,
          name: 'authConfig.password',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          placeholder: passwordPlaceholder,
          dataType: InputDataType.PASSWORD,
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.BASIC],
              // Adding undefined is a bit of a hack here to show this field
              // when the default value is set. This will be removed soon.
              'authConfig.shareBasicAuthCreds': ['true', 'undefined']
            }
          }
        },
        {
          label: '',
          messageTemplate: `The authorization header will be automatically generated when you send requests.
          Learn more about [Basic Auth](https://docs.superblocks.com/integrations/authentication/#basic-authentication) authorization.`,
          name: 'HTTPBasicAlert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          display: {
            show: {
              authType: [IntegrationAuthType.BASIC]
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }
  if (enabledMethods.bearer) {
    addField(
      authFields,
      [
        {
          label: 'Token',
          name: 'authConfig.bearerToken',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          rules: [{ required: true, message: 'Bearer token is required' }],
          placeholder: `bearer-token`,
          dataType: InputDataType.PASSWORD,
          tooltip: {
            markdownText: `Specify the bearer token to be used for authentication`
          },
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.BEARER]
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }
  if (enabledMethods.tokenPrefixed) {
    addField(
      authFields,
      [
        {
          label: 'Token',
          name: 'authConfig.token',
          startVersion: RestApiIntegrationPluginVersions.V13,
          componentType: FormComponentType.INPUT_TEXT,
          rules: [{ required: true, message: 'Token is required' }],
          placeholder: `token`,
          dataType: InputDataType.PASSWORD,
          tooltip: {
            markdownText: `Specify the token to be used for authentication`
          },
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.TOKEN_PREFIXED]
            }
          }
        }
      ],
      fieldNamesToHide
    );

    if (typeof enabledMethods.tokenPrefixed === 'object' && enabledMethods.tokenPrefixed.prefix) {
      addField(
        authFields,
        [
          {
            label: '',
            name: 'authConfig.prefix',
            startVersion: RestApiIntegrationPluginVersions.V13,
            componentType: FormComponentType.INPUT_TEXT,
            initialValue: enabledMethods.tokenPrefixed.prefix,
            display: {
              show: {
                authType: [IntegrationAuthType.TOKEN_PREFIXED]
              }
            },
            hidden: true,
            disabled: true
          }
        ],
        fieldNamesToHide
      );
    }
  }
  if (enabledMethods.apiKeyForm) {
    for (const apiKey of enabledMethods.apiKeyForm) {
      addField(
        authFields,
        [
          {
            label: '',
            name: `authConfig.apiKeys.${apiKey.key}.header`,
            startVersion: RestApiIntegrationPluginVersions.V13,
            componentType: FormComponentType.INPUT_TEXT,
            initialValue: apiKey.header,
            display: {
              show: {
                authType: [IntegrationAuthType.API_KEY_FORM]
              }
            },
            hidden: true,
            disabled: true
          }
        ],
        fieldNamesToHide
      );
      addField(
        authFields,
        [
          {
            label: '',
            name: `authConfig.apiKeys.${apiKey.key}.prefix`,
            startVersion: RestApiIntegrationPluginVersions.V13,
            componentType: FormComponentType.INPUT_TEXT,
            initialValue: apiKey.valuePrefix || '',
            display: {
              show: {
                authType: [IntegrationAuthType.API_KEY_FORM]
              }
            },
            hidden: true,
            disabled: true
          }
        ],
        fieldNamesToHide
      );
      addField(
        authFields,
        [
          {
            label: apiKey.label,
            name: `authConfig.apiKeys.${apiKey.key}.token`,
            startVersion: RestApiIntegrationPluginVersions.V13,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.PASSWORD,
            singleLine: false,
            rules: [{ required: true, message: `${apiKey.label} is required` }],
            display: {
              show: {
                authType: [IntegrationAuthType.API_KEY_FORM]
              }
            }
          }
        ],
        fieldNamesToHide
      );
    }
  }
  if (enabledMethods.apiKey) {
    addField(
      authFields,
      [
        {
          label: 'Key',
          name: 'authConfig.key',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          rules: [{ required: true, message: 'Key is required' }],
          placeholder: `api key`,
          tooltip: { markdownText: apiKeyMarkdownText(pluginId) },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.API_KEY]
            }
          }
        },
        {
          label: 'Value',
          name: 'authConfig.value',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          rules: [{ required: true, message: 'Value is required' }],
          placeholder: `value`,
          dataType: InputDataType.PASSWORD,
          tooltip: {
            markdownText: `The value corresponding to the API key`
          },
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.API_KEY]
            }
          }
        }
      ],
      fieldNamesToHide
    );
    if (pluginId === ExtendedIntegrationPluginId.REST_API) {
      addField(
        authFields,
        [
          {
            label: 'Add to',
            name: 'authConfig.method',
            startVersion: startVersion,
            componentType: FormComponentType.DROPDOWN,
            initialValue: ApiKeyMethod.HEADER,
            options: apiKeyAuthOptions(pluginId),
            tooltip: {
              markdownText: `How the API key is passed to the API (as a header or as a query parameter)`
            },
            singleLine: true,
            display: {
              show: {
                authType: [IntegrationAuthType.API_KEY]
              }
            }
          }
        ],
        fieldNamesToHide
      );
    } else if (pluginId === ExtendedIntegrationPluginId.GRAPHQL) {
      addField(
        authFields,
        [
          {
            label: '',
            name: 'authConfig.method',
            startVersion,
            componentType: FormComponentType.INPUT_TEXT,
            initialValue: ApiKeyMethod.HEADER,
            hidden: true,
            display: {
              show: {
                authType: [IntegrationAuthType.API_KEY]
              }
            }
          }
        ],
        fieldNamesToHide
      );
    }
  }
  if (enabledMethods.firebase) {
    addField(
      authFields,
      [
        {
          label: '',
          messageTemplate: `**Where do I get my firebase credentials and allow access to Superblocks?** [Superblocks - Firebase Docs](https://docs.superblocks.com/integrations/authenticating-apis/authenticate-using-firebase-auth)\\
  Note: REST APIs authenticated with firebase cannot be used in Superblocks Workflows & Scheduled Jobs since both can be called headlessly without user interaction.`,
          name: 'FirebaseAlert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          display: {
            show: {
              authType: [IntegrationAuthType.FIREBASE]
            }
          }
        },
        {
          label: 'API config',
          name: 'authConfig.apiKey',
          startVersion: startVersion,
          componentType: FormComponentType.CODE_EDITOR,
          language: EditorLanguage.JSON,
          tooltip: {
            markdownText: `The API config can be found through the Firebase
      portal. It's used to identify your app to Firebase.`
          },
          placeholder: `{
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
  }
      `,
          display: {
            show: {
              authType: [IntegrationAuthType.FIREBASE]
            }
          }
        },
        {
          label: 'Enable login with email/password',
          name: 'authConfig.email',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          display: {
            show: {
              authType: [IntegrationAuthType.FIREBASE]
            }
          },
          initialValue: true
        },
        {
          label: 'Enable login with Google',
          name: 'authConfig.google',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          display: {
            show: {
              authType: [IntegrationAuthType.FIREBASE]
            }
          }
        },
        {
          label: '',
          messageTemplate: `Use **{{firebase.token}}** below to refer to the firebase
      authentication token & use **{{firebase.userId}}** to refer to the
      currently authenticated user's ID.`,
          name: 'FirebaseAlert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          display: {
            show: {
              authType: [IntegrationAuthType.FIREBASE]
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }

  // Following fields are for newly defined plugin (as proto) and their datasource configurations
  // TODO make this composite pattern
  if (enabledMethods.passwordGrantFlow || enabledMethods.clientCredentialsFlow) {
    authFields.push(
      {
        label: 'Token URL',
        name: 'connection.auth.method.value.tokenUrl',
        startVersion: startVersion,
        componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
        rules: [{ required: true, message: 'Token URL is required' }],
        tooltip: {
          markdownText: `The endpoint for authorization server. This is used to get the access token.`
        },
        singleLine: true,
        display: {
          show: {
            'connection.auth.method.case': ['passwordGrantFlow', 'clientCredentialsFlow']
          }
        },
        placeholder: 'https://login.salesforce.com/services/oauth2/token'
      },
      {
        label: 'Consumer key',
        name: 'connection.auth.method.value.clientId',
        startVersion: startVersion,
        componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
        placeholder: `my consumer key`,
        rules: [{ required: true, message: 'Consumer Key is required' }],
        tooltip: {
          markdownText: `A public identifier used to identify this Salesforce consumer
    to the authorization/token servers.`
        },
        singleLine: true,
        display: {
          show: {
            'connection.auth.method.case': ['passwordGrantFlow', 'clientCredentialsFlow']
          }
        }
      },
      {
        label: 'Consumer secret',
        name: 'connection.auth.method.value.clientSecret',
        startVersion: startVersion,
        componentType: FormComponentType.INPUT_TEXT,
        rules: [{ required: true, message: 'Consumer secret is required' }],
        placeholder: `my consumer secret`,
        dataType: InputDataType.PASSWORD,
        tooltip: {
          markdownText: `A secret shared between the Salesforce consumer and the
    authorizing/token servers to verify the Consumer Key.`
        },
        singleLine: false,
        display: {
          show: {
            'connection.auth.method.case': ['passwordGrantFlow', 'clientCredentialsFlow']
          }
        }
      },
      {
        label: 'Username',
        name: 'connection.auth.method.value.username',
        startVersion: startVersion,
        componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
        placeholder: `username`,
        singleLine: true,
        rules: [{ required: true, message: 'Username is required' }],
        display: {
          show: {
            'connection.auth.method.case': ['passwordGrantFlow']
          }
        }
      },
      {
        label: 'Password',
        name: 'connection.auth.method.value.password',
        startVersion: startVersion,
        componentType: FormComponentType.INPUT_TEXT,
        placeholder: 'password',
        dataType: InputDataType.PASSWORD,
        singleLine: false,
        rules: [{ required: true, message: 'Password is required' }],
        display: {
          show: {
            'connection.auth.method.case': ['passwordGrantFlow']
          }
        }
      }
    );
  }
  // following is used by old datasource configurations (defined using typescript)
  if (enabledMethods.oauth) {
    addField(
      authFields,
      [
        {
          label: '',
          messageTemplate: `Bindings such as \`{{ Env.client_secret }}\` aren't supported for this auth type. Please explicitly set configuration values.`,
          name: 'oauth-binding-alert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          type: 'warning',
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_IMPLICIT]
            }
          }
        },
        {
          label: '',
          messageTemplate: `Bindings such as \`{{ Env.client_secret }}\` are only supported for the "Client secret" field for this auth type. Please explicitly set configuration values for the remaining fields.`,
          name: 'oauth-binding-alert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          type: 'warning',
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Callback URL',
          name: 'oauth-callback-alert',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          disabled: true,
          immutable: true,
          initialValue: `<%= origin %>/${OAUTH_CALLBACK_PATH}`,
          tooltip: {
            markdownText: `This is where users will be redirected after authorization. Add this to your application's list of allowed callback URLs.`
          },
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE, IntegrationAuthType.OAUTH2_IMPLICIT]
            }
          },
          enableCopy: true,
          singleLine: false
        },
        {
          label: 'Authorization URL',
          name: 'authConfig.authorizationUrl',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          rules: [{ required: true, message: 'Authorization URL is required' }],
          tooltip: {
            markdownText: `The endpoint for authorization server. This is used to get the authorization code.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_IMPLICIT, IntegrationAuthType.OAUTH2_CODE]
            }
          },
          placeholder: `https://example.com/login/oauth/authorize`
        },
        {
          label: 'Token URL',
          name: 'authConfig.tokenUrl',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          rules: [{ required: true, message: 'Token URL is required' }],
          tooltip: {
            markdownText: `The endpoint for authorization server. This is used to get the access token.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_PASSWORD, IntegrationAuthType.OAUTH2_CLIENT_CREDS, IntegrationAuthType.OAUTH2_CODE]
            }
          },
          placeholder: `https://example.com/login/oauth/token`
        },
        {
          label: 'Client ID',
          name: 'authConfig.clientId',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          placeholder: `Client ID`,
          rules: [{ required: true, message: 'Client ID is required' }],
          tooltip: {
            markdownText: `The ID issued to the client during client registration.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [
                IntegrationAuthType.OAUTH2_PASSWORD,
                IntegrationAuthType.OAUTH2_CLIENT_CREDS,
                IntegrationAuthType.OAUTH2_IMPLICIT,
                IntegrationAuthType.OAUTH2_CODE
              ]
            }
          }
        },
        {
          label: 'Client secret',
          name: 'authConfig.clientSecret',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          rules: [{ required: true, message: 'Client secret is required' }],
          placeholder: `Client Secret`,
          dataType: InputDataType.PASSWORD,
          tooltip: {
            markdownText: `The secret issued to the client during client registration.`
          },
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_PASSWORD, IntegrationAuthType.OAUTH2_CLIENT_CREDS, IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          // TODO: Ideally hide behind an advanced setting with audience.
          label: 'Audience',
          name: 'authConfig.audience',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          tooltip: {
            markdownText: `The intended recipient of the token, most likely a resource server.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [
                IntegrationAuthType.OAUTH2_CLIENT_CREDS,
                IntegrationAuthType.OAUTH2_CODE,
                IntegrationAuthType.OAUTH2_IMPLICIT,
                IntegrationAuthType.OAUTH2_PASSWORD
              ]
            }
          }
        },
        {
          // TODO: Ideally hide behind an advanced setting with audience.
          label: 'Prompt',
          name: 'authConfig.promptType',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          initialValue: 'consent',
          placeholder: 'consent',
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE, IntegrationAuthType.OAUTH2_IMPLICIT]
            }
          }
        },
        {
          label: 'Scope',
          name: 'authConfig.scope',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          placeholder: `e.g. openid email read:org`,
          tooltip: {
            markdownText: `The scope of access request. It may have multiple space-separated values.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CLIENT_CREDS, IntegrationAuthType.OAUTH2_IMPLICIT, IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Share username/password across all users',
          name: 'authConfig.useFixedPasswordCreds',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          tooltip: {
            markdownText: `Username/password credentials to use when connecting. If not set, users will be prompted for their credentials.`
          },
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_PASSWORD]
            }
          },
          initialValue: false
        },
        {
          label: 'Client authentication',
          name: 'authConfig.clientAuthMethod',
          startVersion: startVersion,
          componentType: FormComponentType.DROPDOWN,
          initialValue: ClientAuthMethod.POST,
          options: [
            {
              displayName: 'Send client credentials in body',
              key: ClientAuthMethod.POST,
              value: ClientAuthMethod.POST
            },
            {
              displayName: 'Send as Basic Auth header',
              key: ClientAuthMethod.BASIC,
              value: ClientAuthMethod.BASIC
            }
          ],
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Send state parameter',
          name: 'authConfig.sendOAuthState',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          tooltip: {
            markdownText: `Opaque state value will be sent to prevent cross-site request forgery.`
          },
          initialValue: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Username',
          name: 'authConfig.username',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          placeholder: `username`,
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_PASSWORD],
              'authConfig.useFixedPasswordCreds': ['true']
            }
          }
        },
        {
          label: 'Password',
          name: 'authConfig.password',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          placeholder: `password`,
          dataType: InputDataType.PASSWORD,
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_PASSWORD],
              'authConfig.useFixedPasswordCreds': ['true']
            }
          }
        },
        {
          label: '',
          messageTemplate: `Send your token to requests by adding it to a header or parameter using **\`{{ oauth.token }}\`**.
          Learn more in our docs on [using OAuth2.0 in Superblocks](https://docs.superblocks.com/integrations/authentication/#oauth-20).`,
          name: 'OAuth2PasswordAlert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          display: {
            show: {
              authType: [
                IntegrationAuthType.OAUTH2_PASSWORD,
                IntegrationAuthType.OAUTH2_CLIENT_CREDS,
                IntegrationAuthType.OAUTH2_IMPLICIT,
                IntegrationAuthType.OAUTH2_CODE
              ]
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }
  if (enabledMethods.oauth2BringYourOwn) {
    addField(
      authFields,
      [
        {
          label: 'Callback URL',
          name: 'oauth-callback-alert',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          disabled: true,
          immutable: true,
          initialValue: `<%= origin %>/${OAUTH_CALLBACK_PATH}`,
          tooltip: {
            markdownText: `This is where users will be redirected after authorization. Add this to your application's list of allowed callback URLs.`
          },
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          },
          enableCopy: true,
          singleLine: false
        },
        {
          label: 'Access token URL',
          name: 'authConfig.tokenUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods.oauth2BringYourOwn?.tokenUrl
        },
        {
          label: 'Authorization URL',
          name: 'authConfig.authorizationUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods.oauth2BringYourOwn?.authorizationUrl
        },
        {
          label: 'Revoke token URL',
          name: 'authConfig.revokeTokenUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods?.oauth2BringYourOwn?.revokeTokenUrl
        },
        {
          label: 'User info URL',
          name: 'authConfig.userInfoUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods?.oauth2BringYourOwn?.userInfoUrl
        },
        {
          label: 'Server-side token refresh',
          name: 'authConfig.refreshTokenFromServer',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: false
        },
        {
          label: 'Client ID',
          name: 'authConfig.clientId',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          placeholder: `Client ID`,
          rules: [{ required: true, message: 'Client ID is required' }],
          tooltip: {
            markdownText: `The client identifier issued to the client during the application registration process.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Client secret',
          name: 'authConfig.clientSecret',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          rules: [{ required: true, message: 'Client secret is required' }],
          placeholder: `Client Secret`,
          dataType: InputDataType.PASSWORD,
          tooltip: {
            markdownText: `The client secret issues to the client during the application registration process.`
          },
          singleLine: false,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Audience',
          name: 'authConfig.audience',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          tooltip: {
            markdownText: `The intended recipient of the token, most likely a resource server.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Scope',
          name: 'authConfig.scope',
          startVersion: startVersion,
          componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
          placeholder: `e.g. openid email read:org`,
          tooltip: {
            markdownText: `The scope of access request. It may have multiple space-separated values.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Client authentication',
          name: 'authConfig.clientAuthMethod',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods.oauth2BringYourOwn?.clientAuthMethod ?? ClientAuthMethod.POST
        },
        {
          label: 'Send state parameter',
          name: 'authConfig.sendOAuthState',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          initialValue: true,
          tooltip: {
            markdownText: `Opaque state value will be sent to prevent cross-site request forgery.`
          },
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Share access token across all users',
          name: 'authConfig.tokenScope',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          },
          mapBooleansTo: {
            true: TokenScope.DATASOURCE,
            false: TokenScope.USER
          },
          initialValue: TokenScope.DATASOURCE,
          validateReduxPath: {
            true: {
              selector: 'selectHasConnectedTokens',
              validValue: true,
              errorMessage: `You must connect to ${pluginName} before you can share access token`
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }
  if (enabledMethods.oauth2SuperblocksClient) {
    addField(
      authFields,
      [
        {
          label: 'Callback URL',
          name: 'oauth-callback-alert',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          disabled: true,
          immutable: true,
          initialValue: `<%= origin %>/${OAUTH_CALLBACK_PATH}`,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          },
          enableCopy: true,
          singleLine: false
        },
        {
          label: 'Access token URL',
          name: 'authConfig.tokenUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods?.oauth2SuperblocksClient?.tokenUrl
        },
        {
          label: 'Authorization URL',
          name: 'authConfig.authorizationUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods?.oauth2SuperblocksClient?.authorizationUrl
        },
        {
          label: 'Revoke token URL',
          name: 'authConfig.revokeTokenUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods?.oauth2SuperblocksClient?.revokeTokenUrl
        },
        {
          label: 'User info URL',
          name: 'authConfig.userInfoUrl',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: enabledMethods?.oauth2SuperblocksClient?.userInfoUrl
        },
        {
          label: 'Server-side token refresh',
          name: 'authConfig.refreshTokenFromServer',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          hidden: true,
          initialValue: true
        },
        {
          label: 'Client ID',
          name: 'authConfig.clientId',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          placeholder: `Client ID`,
          rules: [{ required: true, message: 'Client ID is required' }],
          tooltip: {
            markdownText: `A public identifier used to identify this client
    to the authorization/token servers.`
          },
          singleLine: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          },
          hidden: true,
          initialValue: enabledMethods?.oauth2SuperblocksClient?.clientId
        },
        {
          label: 'Audience',
          name: 'authConfig.audience',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          tooltip: {
            markdownText: `The intended recipient of the token, most likely a resource server.`
          },
          singleLine: true,
          hidden: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        },
        {
          label: 'Scope',
          name: 'authConfig.scope',
          startVersion: startVersion,
          componentType: FormComponentType.INPUT_TEXT,
          placeholder: `e.g. openid email read:org`,
          tooltip: {
            markdownText: `The scope of access request. It may have multiple space-separated values.`
          },
          singleLine: true,
          hidden: true,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE, GoogleSheetsAuthType.SERVICE_ACCOUNT]
            }
          }
        },
        {
          label: 'Share access token across all users',
          name: 'authConfig.tokenScope',
          startVersion: startVersion,
          componentType: FormComponentType.CHECKBOX,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          },
          mapBooleansTo: {
            true: TokenScope.DATASOURCE,
            false: TokenScope.USER
          },
          initialValue: TokenScope.DATASOURCE,
          validateReduxPath: {
            true: {
              selector: 'selectHasConnectedTokens',
              validValue: true,
              errorMessage: `You must connect to ${pluginName} before you can share access token`
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }

  if (enabledMethods.oauth2SuperblocksClient || enabledMethods.oauth2BringYourOwn) {
    addField(
      authFields,
      [
        {
          label: '',
          name: 'OAuth2ConnectedAlert',
          startVersion: startVersion,
          componentType: FormComponentType.ALERT,
          messageTemplate:
            `<%= datasourceMeta?.metadata?.connectedUserTokens?.[configurationId]?.[0]
              ? 'You are connected to ${pluginName}'
              : undefined %>` +
            `<%= datasourceMeta?.metadata?.connectedUserTokens?.[configurationId]?.[0]?.tokenMetadata?.email
              ? ' as ' + datasourceMeta?.metadata?.connectedUserTokens?.[configurationId]?.[0]?.tokenMetadata?.email + '!'
              : datasourceMeta?.metadata?.connectedUserTokens?.[configurationId]?.[0]
              ? '!'
              : undefined
            %>`,
          type: 'success',
          showIcon: true
        }
      ],
      fieldNamesToHide
    );
  }

  formSections.push({
    name: 'auth',
    borderThreshold: 1,
    items: authFields
  });

  const authButtons: FormItem[] = [];

  if (enabledMethods.oauth2BringYourOwn || enabledMethods.oauth2SuperblocksClient) {
    const authorizationExtraParams =
      enabledMethods?.oauth2BringYourOwn?.authorizationExtraParams || enabledMethods.oauth2SuperblocksClient?.authorizationExtraParams;
    const iconUrl = enabledMethods?.oauth2BringYourOwn?.iconUrl || enabledMethods.oauth2SuperblocksClient?.iconUrl;
    addField(
      authButtons,
      [
        {
          label: `Connect to ${pluginName}`,
          name: 'oauth-connect-button',
          startVersion: startVersion,
          componentType: FormComponentType.BUTTON,
          buttonType: 'connectOAuth',
          valuesFromContext: [
            'authType',
            'authConfig.scope',
            'authConfig.clientId',
            'authConfig.tokenScope',
            'authConfig.userInfoUrl',
            'authConfig.clientSecret',
            'authConfig.tokenUrl',
            'authConfig.authorizationUrl',
            'authConfig.refreshTokenFromServer',
            'authConfig.clientAuthMethod',
            'dynamicWorkflowConfiguration.enabled',
            'dynamicWorkflowConfiguration.workflowId'
          ],
          extraValues: {
            pluginId: pluginId,
            ...authorizationExtraParams
          },
          iconUrl,
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          },
          dependencies: ['authConfig.tokenScope']
        },
        {
          label: `Revoke token`,
          name: 'oauth-revoke-shared-tokens-button',
          startVersion: startVersion,
          componentType: FormComponentType.BUTTON,
          buttonType: 'revokeOAuthTokens',
          valuesFromContext: [
            'authType',
            'authConfig.scope',
            'authConfig.clientId',
            'authConfig.tokenScope',
            'authConfig.userInfoUrl',
            'authConfig.clientSecret',
            'authConfig.tokenUrl',
            'authConfig.authorizationUrl',
            'authConfig.refreshTokenFromServer',
            'authConfig.revokeTokenUrl'
          ],
          display: {
            show: {
              authType: [IntegrationAuthType.OAUTH2_CODE]
            }
          }
        }
      ],
      fieldNamesToHide
    );
  }

  formSections.push({
    name: 'authButtons',
    items: [
      {
        gridCss: {
          gridTemplateColumns: 'auto 1fr',
          gridTemplateGap: 8
        },
        rowItems: authButtons
      }
    ]
  });

  return formSections;
};

function apiKeyMarkdownText(pluginId: ExtendedIntegrationPluginId): string {
  return `Specify the header key ${
    pluginId === ExtendedIntegrationPluginId.GRAPHQL ? '' : 'or the query parameter'
  } used to pass the API key`;
}

function apiKeyAuthOptions(pluginId: ExtendedIntegrationPluginId): DropdownOption[] {
  const options: DropdownOption[] = [
    {
      displayName: 'Header',
      key: ApiKeyMethod.HEADER,
      value: ApiKeyMethod.HEADER
    }
  ];

  if (pluginId === ExtendedIntegrationPluginId.REST_API) {
    options.push({
      displayName: 'Query parameter',
      key: ApiKeyMethod.QUERY_PARAM,
      value: ApiKeyMethod.QUERY_PARAM
    });
  }
  return options;
}

// This generates the dropdown set of authentication methods available
// for the given plugin/integration.
function authTypeOptions({
  enabledMethods,
  allowNone = true,
  isProto = false
}: {
  enabledMethods: AuthMethods;
  allowNone?: boolean;
  isProto?: boolean;
}): DropdownOption[] {
  const options: DropdownOption[] = allowNone
    ? [
        {
          displayName: getDisplayName(IntegrationAuthType.NONE),
          value: IntegrationAuthType.NONE,
          key: IntegrationAuthType.NONE
        }
      ]
    : [];
  if (enabledMethods.basic) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.BASIC),
      value: IntegrationAuthType.BASIC,
      key: IntegrationAuthType.BASIC
    });
  }
  if (enabledMethods.bearer) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.BEARER),
      value: IntegrationAuthType.BEARER,
      key: IntegrationAuthType.BEARER
    });
  }
  if (enabledMethods.tokenPrefixed) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.TOKEN_PREFIXED),
      value: IntegrationAuthType.TOKEN_PREFIXED,
      key: IntegrationAuthType.TOKEN_PREFIXED
    });
  }
  if (enabledMethods.apiKeyForm) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.API_KEY_FORM),
      value: IntegrationAuthType.API_KEY_FORM,
      key: IntegrationAuthType.API_KEY_FORM
    });
  }
  if (enabledMethods.apiKey) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.API_KEY),
      value: IntegrationAuthType.API_KEY,
      key: IntegrationAuthType.API_KEY
    });
  }
  if (enabledMethods.firebase) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.FIREBASE),
      value: IntegrationAuthType.FIREBASE,
      key: IntegrationAuthType.FIREBASE
    });
  }
  if (enabledMethods.oauth) {
    options.push({
      displayName: getDisplayName(IntegrationAuthType.OAUTH2_CLIENT_CREDS),
      value: IntegrationAuthType.OAUTH2_CLIENT_CREDS,
      key: IntegrationAuthType.OAUTH2_CLIENT_CREDS
    });
    options.push({
      displayName: getDisplayName(IntegrationAuthType.OAUTH2_CODE),
      value: IntegrationAuthType.OAUTH2_CODE,
      key: IntegrationAuthType.OAUTH2_CODE
    });
    options.push({
      displayName: getDisplayName(IntegrationAuthType.OAUTH2_IMPLICIT),
      value: IntegrationAuthType.OAUTH2_IMPLICIT,
      key: IntegrationAuthType.OAUTH2_IMPLICIT
    });
    options.push({
      displayName: getDisplayName(IntegrationAuthType.OAUTH2_PASSWORD),
      value: IntegrationAuthType.OAUTH2_PASSWORD,
      key: IntegrationAuthType.OAUTH2_PASSWORD
    });
  }

  if (enabledMethods.oauth2BringYourOwn) {
    options.push({
      displayName: `OAuth2.0 - Authorization Code`,
      value: IntegrationAuthType.OAUTH2_CODE,
      key: IntegrationAuthType.OAUTH2_CODE
    });
  }

  // following is only used by proto based plugins
  // the keys are proto oneof case options
  if (enabledMethods.passwordGrantFlow) {
    options.push({
      displayName: getDisplayName(NewAuthType.OAUTH2_PASSWORD_GRANT_FLOW),
      value: NewAuthType.OAUTH2_PASSWORD_GRANT_FLOW,
      key: NewAuthType.OAUTH2_PASSWORD_GRANT_FLOW
    });
  }
  if (enabledMethods.clientCredentialsFlow) {
    options.push({
      displayName: getDisplayName(NewAuthType.OAUTH2_CLIENT_CREDS_FLOW),
      value: NewAuthType.OAUTH2_CLIENT_CREDS_FLOW,
      key: NewAuthType.OAUTH2_CLIENT_CREDS_FLOW
    });
  }
  return options;
}
function addField(authFields: FormItem[], fieldsToAdd: FormItem[], fieldNamesToHide: string[]) {
  for (const field of fieldsToAdd) {
    authFields.push({ ...field, hidden: field.hidden || fieldNamesToHide.includes(field.name) });
  }
}
