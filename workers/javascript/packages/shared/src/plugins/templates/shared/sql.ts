import { SQLMappingMode, SQLMatchingMode, SQLOperation } from '@superblocksteam/types/src/plugins/common/v1/plugin_pb';

export const SqlOperations = {
  RUN_SQL: 'run_sql',
  UPDATE_ROWS: 'update_rows'
};

export const SQLMappingModeEnum = SQLMappingMode;
export const SqlMappingMode: Record<number, string> = {
  [SQLMappingMode.SQL_MAPPING_MODE_AUTO]: 'auto',
  [SQLMappingMode.SQL_MAPPING_MODE_MANUAL]: 'manual'
};
export const SQLOperationEnum = SQLOperation;
export const SqlOperation: Record<number, string> = {
  [SQLOperation.SQL_OPERATION_RUN_SQL]: 'run_sql',
  [SQLOperation.SQL_OPERATION_UPDATE_ROWS]: 'update_rows'
};
export const SQLMatchingModeEnum = SQLMatchingMode;
export const SqlMatchingMode: Record<number, string> = {
  [SQLMatchingMode.SQL_MATCHING_MODE_AUTO]: 'auto',
  [SQLMatchingMode.SQL_MATCHING_MODE_ADVANCED]: 'advanced'
};
