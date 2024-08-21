// Integration errors are external errors to Superblocks and thrown from API execution
import { Code as CommonErrorCode } from '@superblocksteam/types/src/common/v1/errors_pb';
import { isEmpty } from 'lodash';

export interface IntegrationInternalError {
  code?: number | string;
  pluginName?: string;
  stack?: string;
}

export class IntegrationError extends Error {
  public code: CommonErrorCode;
  public internalCode: IntegrationInternalError;

  constructor(message: string, errorCode?: CommonErrorCode, internalCode?: IntegrationInternalError) {
    super(message);
    this.name = 'IntegrationError';
    this.code = errorCode ?? CommonErrorCode.UNSPECIFIED;
    this.internalCode = isEmpty(internalCode) ? {} : internalCode;
  }
}
