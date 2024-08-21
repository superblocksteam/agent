import { AuthConfig, AuthType, TokenMetadata, TokenType } from '..';

export type PostUserTokenRequestDto = {
  authConfig?: AuthConfig;
  authType?: AuthType;
  datasourceId?: string;
  configurationId?: string;
  expiresAt?: Date;
  tokenType?: TokenType;
  tokenValue: string;
};

// information about the token without the token value
export type ConnectedUserTokenDto = {
  key: string;
  expires: Date | undefined | null;
  tokenType: string;
  authType: string;
  userId: string | undefined;
  integrationConfigurationId: string;
  integrationId: string;
  tokenMetadata?: TokenMetadata;
};
