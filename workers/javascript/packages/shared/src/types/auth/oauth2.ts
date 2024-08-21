//this file has structures, described in https://www.rfc-editor.org/rfc/rfc6749

export type OAuthErrorResponse = {
  error?: string;
  error_description?: string;
};

export type OAuthTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  issued_at?: number;
  refresh_token?: string;
};

export enum GrantType {
  PASSWORD = 'password',
  AUTHORIZATION_CODE = 'authorization_code',
  CLIENT_CREDENTIALS = 'client_credentials',
  REFRESH_TOKEN = 'refresh_token'
}

export type OAuthBaseTokenRequest = {
  grant_type: GrantType;
  client_id?: string;
  client_secret?: string;
  audience?: string;
  refresh_token?: string;
  redirect_uri?: string;
  scope?: string;
};

export type OAuthRefreshTokenRequest = OAuthBaseTokenRequest & {
  refresh_token?: string;
};

export type OAuthTokenPasswordRequest = OAuthBaseTokenRequest & {
  username?: string;
  password?: string;
};

export type OAuthTokenAuthorizationCodeRequest = OAuthBaseTokenRequest & {
  code?: string;
};
