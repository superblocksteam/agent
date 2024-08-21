export const S3PluginVersions = {
  V1: '0.0.1',
  V5: '0.0.5',
  V6: '0.0.6',
  V10: '0.0.10'
};

export enum S3ActionType {
  LIST_OBJECTS = 'LIST_OBJECTS',
  GET_OBJECT = 'GET_OBJECT',
  DELETE_OBJECT = 'DELETE_OBJECT',
  UPLOAD_OBJECT = 'UPLOAD_OBJECT',
  LIST_BUCKETS = 'LIST_BUCKETS',
  CREATE_BUCKET = 'CREATE_BUCKET',
  UPLOAD_MULTIPLE_OBJECTS = 'UPLOAD_MULTIPLE_OBJECTS',
  GENERATE_PRESIGNED_URL = 'GENERATE_PRESIGNED_URL'
}

export const S3_ACTION_DISPLAY_NAMES: Record<S3ActionType, string> = {
  [S3ActionType.LIST_OBJECTS]: 'List files',
  [S3ActionType.GET_OBJECT]: 'Read file',
  [S3ActionType.DELETE_OBJECT]: 'Delete files',
  [S3ActionType.UPLOAD_OBJECT]: 'Upload file',
  [S3ActionType.LIST_BUCKETS]: 'List buckets',
  [S3ActionType.CREATE_BUCKET]: 'Create bucket',
  [S3ActionType.UPLOAD_MULTIPLE_OBJECTS]: 'Upload multiple files',
  [S3ActionType.GENERATE_PRESIGNED_URL]: 'Generate presigned URL'
};

export const DEFAULT_S3_PRESIGNED_URL_EXPIRATION_SECONDS = 60 * 10;
