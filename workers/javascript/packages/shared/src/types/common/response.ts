import { DatasourceConfiguration } from '../datasource';
import { Timing } from './timing';

export class ResponseWrapper<T> {
  responseMeta: ResponseMeta;
  data?: T;
  api?: T;
  intergrations?: Record<string, DatasourceConfiguration>;

  constructor({ data }: { data: T }) {
    this.responseMeta = new ResponseMeta({
      status: 200,
      message: '',
      success: true
    });
    this.data = data;
  }
}

export class ApiV2ResponseWrapper<T> {
  api: T;

  constructor(api: T) {
    this.api = api;
  }
}

export class ApiV2WithIntegrationsResponseWrapper<T> {
  api: T;
  integrations: Record<string, DatasourceConfiguration>;
  metadata: Record<string, string>;
  stores: { secrets: Array<DatasourceConfiguration> };

  constructor(
    api: T,
    integrations: Record<string, DatasourceConfiguration>,
    metadata: Record<string, string>,
    stores: { secrets: Array<DatasourceConfiguration> }
  ) {
    this.api = api;
    this.integrations = integrations;
    this.metadata = metadata;
    this.stores = stores;
  }
}

export class ApiV2ListResponseWrapper<T> {
  apis: T[];

  constructor(apis: T[]) {
    this.apis = apis;
  }
}

export class ResponseMeta {
  status: number;
  message: string;
  success?: boolean;
  error?: ErrorDto;
  timing?: Timing;

  constructor({ status, message, success }: { status: number; message: string; success: boolean }) {
    this.status = status;
    this.message = message;
    this.success = success;
  }
}

export class ErrorDto {
  code: number;
  message: string;
  superblocksError?: SuperblocksError;

  constructor({ code, message, type }: { code: number; message: string; type?: SuperblocksError }) {
    this.code = code;
    this.message = message;
    this.superblocksError = type;
  }
}

/**
 * To let UI know if http error is caused by superblocks or external
 * This enum is intended to provide additional information on top of general
 * error code and message
 */
export enum SuperblocksError {
  RbacUnauthorized = 'RbacUnauthorized',
  APIKeyInvalid = 'APIKeyInvalid',
  AuthenticatedUserNotFound = 'AuthenticatedUserNotFound',
  UserTokenInvalid = 'UserTokenInvalid',
  JWTExpired = 'JWTExpired'
}
