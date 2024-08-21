export const GCSPluginVersions = {
  V1: '0.0.1'
};

export enum GCSActionType {
  LIST_OBJECTS = 'LIST_OBJECTS',
  GET_OBJECT = 'GET_OBJECT',
  DELETE_OBJECT = 'DELETE_OBJECT',
  UPLOAD_OBJECT = 'UPLOAD_OBJECT',
  LIST_BUCKETS = 'LIST_BUCKETS',
  CREATE_BUCKET = 'CREATE_BUCKET',
  UPLOAD_MULTIPLE_OBJECTS = 'UPLOAD_MULTIPLE_OBJECTS',
  GENERATE_PRESIGNED_URL = 'GENERATE_PRESIGNED_URL'
}

export const GCS_ACTION_DISPLAY_NAMES: Record<GCSActionType, string> = {
  [GCSActionType.LIST_OBJECTS]: 'List files',
  [GCSActionType.GET_OBJECT]: 'Read file',
  [GCSActionType.DELETE_OBJECT]: 'Delete file',
  [GCSActionType.UPLOAD_OBJECT]: 'Upload file',
  [GCSActionType.LIST_BUCKETS]: 'List buckets',
  [GCSActionType.CREATE_BUCKET]: 'Create bucket',
  [GCSActionType.UPLOAD_MULTIPLE_OBJECTS]: 'Upload multiple files',
  [GCSActionType.GENERATE_PRESIGNED_URL]: 'Generate presigned URL'
};

export const DEFAULT_GCS_PRESIGNED_URL_EXPIRATION_SECONDS = 60 * 10;
