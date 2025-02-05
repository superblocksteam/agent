import JSON5 from 'json5';
import { isEmpty } from 'lodash';
import { ClientAuthMethod } from '../../plugins';
import { RedactableExecutionParam } from '../api/execution';
import { OAuthErrorResponse, OAuthTokenResponse } from '../auth';
import { Property } from '../common/property';

export const OAUTH_CALLBACK_PATH = 'oauth/callback';

// this exact string is referenced in addTokenIfNeeded.go, so we need it to match here
export const AUTH_TYPE_OAUTH_TOKEN_EXCHANGE = 'oauth-token-exchange';

export type AuthId = string;

// getAuthId returns the key that is used to identify which token should be used
// for a specific auth type.
// A suffix may be appended for each value that we're caching (eg "-token",
// "-refresh", etc)
export function getAuthId(
  authType: AuthType | undefined,
  authConfig: AuthConfig | undefined,
  integrationId?: string,
  integrationConfigurationId?: string
): AuthId {
  return `${authType}.${getClientId(authType, authConfig, integrationId, integrationConfigurationId)}`;
}

export function getClientId(
  authType: AuthType | undefined,
  config: AuthConfig | undefined,
  integrationId?: string,
  integrationConfigurationId?: string
): string {
  const unknownClient = 'unknown-client';
  if (!authType || !config) {
    return unknownClient;
  }

  const clientIdForAuthType = (): string | undefined => {
    switch (authType) {
      case IntegrationAuthType.BASIC:
        return integrationId ?? '';
      case IntegrationAuthType.FIREBASE: {
        const firebaseConfig = config as FirebaseAuthConfig;
        if (!firebaseConfig.apiKey) {
          return undefined;
        }
        try {
          const parsed = JSON5.parse(firebaseConfig.apiKey);
          return parsed.projectId;
        } catch (err) {
          return undefined;
        }
      }
      case IntegrationAuthType.OAUTH2_PASSWORD: {
        return (config as OAuthConfig).clientId;
      }
      case IntegrationAuthType.OAUTH2_CLIENT_CREDS:
      case IntegrationAuthType.OAUTH2_CODE:
      case IntegrationAuthType.OAUTH2_IMPLICIT:
      case GoogleSheetsAuthType.OAUTH2_CODE: {
        const oauthConfig = config as OAuthConfig;
        let apiId;
        if (oauthConfig.tokenScope === TokenScope.DATASOURCE) {
          apiId = integrationConfigurationId;
        } else {
          apiId = config.clientId;
        }
        // in case there are muliple scopes, separated by a whitespace - sort them before hashing
        const scopeHash = 'scope' in oauthConfig && oauthConfig.scope ? insecureHash(oauthConfig.scope?.split(' ').sort().join(' ')) : null;
        if (!scopeHash || !isEmpty(scopeHash)) {
          // OAuth scopes are optional according to the OAuth spec.
          apiId += `-${scopeHash}`;
        }
        return apiId;
      }
      default:
        return undefined;
    }
  };

  return clientIdForAuthType() ?? unknownClient;
}

// This enum is persisted and used in UI <> agent communication, so take care
// when modifying existing values.
export enum IntegrationAuthType {
  NONE = 'None',
  BASIC = 'basic',
  OAUTH2_CODE = 'oauth-code',
  OAUTH2_CLIENT_CREDS = 'oauth-client-cred',
  OAUTH2_IMPLICIT = 'oauth-implicit',
  OAUTH2_PASSWORD = 'oauth-pword',
  FIREBASE = 'Firebase',
  BEARER = 'bearer',
  API_KEY = 'api-key',
  TOKEN_PREFIXED = 'token-prefixed',
  API_KEY_FORM = 'api-key-form'
}

// IntegrationAuthType are old auth types defined in typescript types
// NewAuth Type is defined by proto Auth message
export enum NewAuthType {
  OAUTH2_PASSWORD_GRANT_FLOW = 'passwordGrantFlow',
  OAUTH2_AUTH_CODE_FLOW = 'authorizationCodeFlow',
  OAUTH2_CLIENT_CREDS_FLOW = 'clientCredentialsFlow'
}

export function isRedirectRequired(authType: AuthType | undefined): boolean {
  switch (authType) {
    case IntegrationAuthType.OAUTH2_CODE:
    case IntegrationAuthType.OAUTH2_IMPLICIT:
      return true;
    default:
      return false;
  }
}

// This enum is used in agent API execution, and API step headers display, so take care
// when modifying existing values.
export const IntegrationAuthHeaderPrefixMap = {
  [IntegrationAuthType.BASIC]: 'Basic ',
  [IntegrationAuthType.BEARER]: 'Bearer ',
  [IntegrationAuthType.OAUTH2_CODE]: 'Bearer ',
  // this is the default prefix for this auth type, but is overridable
  // using the prefix field in the corresponding authConfig
  [IntegrationAuthType.TOKEN_PREFIXED]: 'Bearer '
};

// This enum enumerates the different ways the API Key authentication method can
// propagate the provided key-value pair.
export enum ApiKeyMethod {
  HEADER = 'header',
  QUERY_PARAM = 'query-param'
}

export enum GoogleSheetsAuthType {
  // this is used in GoogleSheetsPlugin.preCreateValidate
  OAUTH2_CODE = 'oauth-code',
  SERVICE_ACCOUNT = 'service-account'
}

export enum AWSAuthType {
  ACCESS_KEY = 'access-key',
  TOKEN_FILE = 'token-file',
  EC2_INSTANCE_METADATA = 'ec2-instance-metadata'
}

export const awsAuthTypeDisplayName = new Map([
  [AWSAuthType.ACCESS_KEY, 'Access Key'],
  [AWSAuthType.TOKEN_FILE, 'Token File'],
  [AWSAuthType.EC2_INSTANCE_METADATA, 'EC2 Instance Metadata']
]);

export function getAWSAuthTypeDisplayName(authType: AWSAuthType): string {
  return awsAuthTypeDisplayName.get(authType) ?? '';
}

export type AuthType = IntegrationAuthType | GoogleSheetsAuthType | NewAuthType;

export function getDisplayName(authType: AuthType): string {
  switch (authType) {
    case IntegrationAuthType.BASIC:
      return 'Basic Authentication';
    case IntegrationAuthType.FIREBASE:
      return 'Firebase';
    case NewAuthType.OAUTH2_PASSWORD_GRANT_FLOW:
    case IntegrationAuthType.OAUTH2_PASSWORD:
      // APIs should be migrating away from this grant type. Add legacy to hint
      // to users this is probably not the grant type they want.
      return 'OAuth2 - Password Grant (Legacy)';
    case NewAuthType.OAUTH2_CLIENT_CREDS_FLOW:
    case IntegrationAuthType.OAUTH2_CLIENT_CREDS:
      return 'OAuth2 - Client Credentials Grant';
    case IntegrationAuthType.OAUTH2_IMPLICIT:
      return 'OAuth2 - Implicit Grant';
    case NewAuthType.OAUTH2_AUTH_CODE_FLOW:
    case IntegrationAuthType.OAUTH2_CODE:
      return 'OAuth2 - Authorization Code';
    case IntegrationAuthType.BEARER:
      return 'Bearer Token';
    case IntegrationAuthType.TOKEN_PREFIXED:
      return 'Token';
    case IntegrationAuthType.API_KEY:
      return 'API Key';
    case IntegrationAuthType.API_KEY_FORM:
      return 'API Key';
    case IntegrationAuthType.NONE:
    default:
      return 'None';
  }
}

export type PublicFirebaseAuthConfig = {
  apiKey?: string;
  google?: boolean;
  email?: boolean;
};

export type FirebaseAuthConfig = PublicFirebaseAuthConfig;

export type PublicOAuthConfig = PublicOAuthPasswordConfig &
  PublicOAuthClientCredsConfig &
  PublicOAuthImplicitConfig &
  PublicOAuthCodeConfig;
export type OAuthConfig = OAuthPasswordConfig &
  OAuthClientCredsConfig &
  OAuthImplicitConfig &
  OAuthCodeConfig &
  OAuthBringYourOwnClientConfig;

type PublicOAuthPasswordConfig = {
  clientId?: string;
  tokenUrl?: string;
  useFixedPasswordCreds?: boolean;
};

export type OAuthPasswordConfig = PublicOAuthPasswordConfig & {
  clientSecret?: string;
  // A fixed username and password can be optionally provided.
  username?: string;
  password?: string;
};

type PublicOAuthClientCredsConfig = {
  clientId?: string;
  tokenUrl?: string;
  scope?: string;
};

export type OAuthClientCredsConfig = PublicOAuthClientCredsConfig & {
  clientSecret?: string;
  audience?: string;
};

type PublicOAuthImplicitConfig = {
  clientId?: string;
  authorizationUrl?: string;
  scope?: string;
};

export type OAuthImplicitConfig = PublicOAuthImplicitConfig & {
  clientSecret?: string;
};

type PublicOAuthCodeConfig = {
  clientId?: string;
  authorizationUrl?: string;
  authUrl?: string; // @deprecated orchestrator uses this
  userInfoUrl?: string;
  tokenUrl?: string;
  scope?: string;
  audience?: string;
  promptType?: string;
  refreshTokenFromServer?: boolean; //TODO(alex): maybe rename to something like bringYourOwnClient
  tokenScope?: TokenScope;
  revokeTokenUrl?: string;
  authToken?: string;
  hasToken?: boolean; // @deprecated not used anymore
  userEmail?: string; // @deprecated not used anymore
  sendOAuthState?: boolean;
};

export type OAuthCodeConfig = PublicOAuthCodeConfig & {
  clientSecret?: string;
};

export enum TokenScope {
  DATASOURCE = 'datasource',
  USER = 'user'
}

type OAuthBringYourOwnClientConfig = {
  tokenUrl?: string;
  authorizationUrl?: string;
  revokeTokenUrl?: string;
  clientSecret?: string;
  clientAuthMethod?: ClientAuthMethod;
};

export enum TokenType {
  REFRESH = 'refresh',
  USER = 'userId',
  // Access token is persisted as "token" for backwards compatibility.
  ACCESS = 'token',
  ID = 'id-token'
}

export type TokenMetadata = {
  email?: string;
};

export function userAccessibleTokens(): TokenType[] {
  return [TokenType.USER, TokenType.ACCESS];
}

type FakeBoolean = boolean | string;

export type BasicAuthConfig = PublicBasicAuthConfig & {
  username?: string;
  password?: string;
};

export type PublicBasicAuthConfig = {
  shareBasicAuthCreds?: FakeBoolean;
};

export type BearerTokenAuthConfig = {
  bearerToken?: string;
};

export type TokenPrefixedAuthConfig = {
  prefix?: string;
  token?: string;
};

export type ApiKeyFormAuthConfig = {
  apiKeys?: Record<string, { header?: string; token?: string }>;
};

export type ApiKeyAuthConfig = {
  key?: string;
  value?: string;
  method?: ApiKeyMethod;
};

export const extractPublic = (authType: AuthType | undefined, authConfig: AuthConfig | undefined): PublicAuthConfig => {
  switch (authType) {
    case IntegrationAuthType.BASIC:
      return {
        shareBasicAuthCreds: authConfig?.shareBasicAuthCreds
      };
    case IntegrationAuthType.OAUTH2_CLIENT_CREDS:
      return {
        clientId: authConfig?.clientId,
        tokenUrl: authConfig?.tokenUrl,
        scope: authConfig?.scope
      };
    case IntegrationAuthType.OAUTH2_CODE:
      return {
        clientId: authConfig?.clientId,
        authorizationUrl: authConfig?.authorizationUrl,
        tokenUrl: authConfig?.tokenUrl,
        scope: authConfig?.scope,
        audience: authConfig?.audience,
        refreshTokenFromServer: authConfig?.refreshTokenFromServer,
        hasToken: authConfig?.hasToken,
        tokenScope: authConfig?.tokenScope,
        promptType: authConfig?.promptType,
        sendOAuthState: authConfig?.sendOAuthState
      };
    case IntegrationAuthType.OAUTH2_IMPLICIT:
      return {
        clientId: authConfig?.clientId,
        authorizationUrl: authConfig?.authorizationUrl,
        scope: authConfig?.scope,
        audience: authConfig?.audience
      };
    case IntegrationAuthType.OAUTH2_PASSWORD:
      return {
        clientId: authConfig?.clientId,
        tokenUrl: authConfig?.tokenUrl,
        useFixedPasswordCreds: authConfig?.useFixedPasswordCreds,
        audience: authConfig?.audience
      };
    case IntegrationAuthType.FIREBASE:
      return authConfig ?? {};
    case IntegrationAuthType.NONE:
      return authConfig ?? {};
    case GoogleSheetsAuthType.OAUTH2_CODE:
    case GoogleSheetsAuthType.SERVICE_ACCOUNT:
    case IntegrationAuthType.BEARER:
    case IntegrationAuthType.TOKEN_PREFIXED:
    case IntegrationAuthType.API_KEY:
    case IntegrationAuthType.API_KEY_FORM:
      return {};
    default:
      throw new Error(`unknown auth type: ${authType}`);
  }
};

type ServiceAccountConfig = {
  googleServiceAccount?: Property;
};

type PublicRestAuthConfig = PublicBasicAuthConfig & PublicOAuthConfig & PublicFirebaseAuthConfig;
type PublicGoogleSheetsAuthConfig = PublicOAuthCodeConfig;
export type PublicAuthConfig = PublicRestAuthConfig & PublicGoogleSheetsAuthConfig;

// TODO(aayush): Rename RestAuthConfig to something more generic as it is also
// used for GraphQL.
export type RestAuthConfig = BasicAuthConfig &
  OAuthConfig &
  FirebaseAuthConfig &
  BearerTokenAuthConfig &
  TokenPrefixedAuthConfig &
  ApiKeyFormAuthConfig &
  ApiKeyAuthConfig;
export type GoogleSheetsAuthConfig = OAuthCodeConfig & ServiceAccountConfig;
export type AuthConfig = RestAuthConfig & GoogleSheetsAuthConfig;

// TODO: this lives here for now to avoid a cyclic dependency. The utils
// directory transitively depends on this file.
// An insecure hash function used to condense a string.
const insecureHash = (s: string | undefined): string => {
  // We need the redundant `!s` check to satisfy the type checker that s is not
  // undefined.
  if (!s || isEmpty(s)) {
    return '';
  }
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    // Convert to 32 bits.
    hash = hash & hash;
  }
  return hash.toString();
};

export type AuthContext = Record<AuthId, RedactableExecutionParam[]>;

export type ExchangeCodeRequest = {
  authId: AuthId;
  authType: AuthType;
  authConfig: AuthConfig;
  accessCode: string;
  pluginId: string;
  origin: string;
  grantedScope: string | null;
  integrationId: string | undefined; // used for embedded user only
  configurationId: string | undefined; // used for embedded user only
};

export type ExchangeCodeResponse = {
  successful: boolean;
  error?: string;
};

export function isExchangeCodeResponse(
  obj:
    | ExchangeCodeResponse
    | {
        success: boolean;
        result?: void;
        error?: string | undefined;
      }
): obj is ExchangeCodeResponse {
  return 'successful' in obj;
}

export type RequestTokenRequest = {
  datasourceId: string;
  username: string;
  password: string;
  environment?: string;
};

export type RequestTokenResponse = OAuthTokenResponse &
  OAuthErrorResponse & {
    expirationTimestamp?: number;
  };

export type DatasourceAuthState = DatasourceOneTimeState & {
  integrationId: string;
  configurationId: string;
  pluginId: string;
  authType: AuthType;
  authId: string;
  authConfig: {
    refreshTokenFromServer?: boolean;
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    authorizationUrl: string;
    userInfoUrl?: string;
    tokenScope: TokenScope;
    scope: string | undefined;
    clientAuthMethod?: ClientAuthMethod;
  };
  origin: string;
};

export function isDatasourceAuthState(aus: DatasourceAuthState | DatasourceOneTimeState): aus is DatasourceAuthState {
  return (
    'integrationId' in aus && 'configurationId' in aus && 'authType' in aus && 'authId' in aus && 'authConfig' in aus && 'origin' in aus
  );
}

export type DatasourceOneTimeState = {
  oneTimeCode: string;
  useLocalStorage: boolean;
  integrationId: string;
  externalUser: boolean;
};

export type DeleteDatasourceOnAgentResult = {
  message?: string;
  success: boolean;
};
