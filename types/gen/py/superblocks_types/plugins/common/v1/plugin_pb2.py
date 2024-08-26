# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: plugins/common/v1/plugin.proto
# Protobuf Python Version: 5.27.3
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    27,
    3,
    '',
    'plugins/common/v1/plugin.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from superblocks_types.buf.validate import validate_pb2 as buf_dot_validate_dot_validate__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1eplugins/common/v1/plugin.proto\x12\x11plugins.common.v1\x1a\x1b\x62uf/validate/validate.proto\"\x7f\n\x1c\x44ynamicWorkflowConfiguration\x12\x1d\n\x07\x65nabled\x18\x01 \x01(\x08H\x00R\x07\x65nabled\x88\x01\x01\x12$\n\x0bworkflow_id\x18\x02 \x01(\tH\x01R\nworkflowId\x88\x01\x01\x42\n\n\x08_enabledB\x0e\n\x0c_workflow_id\"\xa7\x02\n\tAWSConfig\x12\x1b\n\x06region\x18\x01 \x01(\tH\x00R\x06region\x88\x01\x01\x12:\n\x04\x61uth\x18\x02 \x01(\x0b\x32!.plugins.common.v1.AWSConfig.AuthH\x01R\x04\x61uth\x88\x01\x01\x1a\xac\x01\n\x04\x41uth\x12\'\n\raccess_key_id\x18\x01 \x01(\tH\x00R\x0b\x61\x63\x63\x65ssKeyId\x88\x01\x01\x12\"\n\nsecret_key\x18\x02 \x01(\tH\x01R\tsecretKey\x88\x01\x01\x12%\n\x0ciam_role_arn\x18\x03 \x01(\tH\x02R\niamRoleArn\x88\x01\x01\x42\x10\n\x0e_access_key_idB\r\n\x0b_secret_keyB\x0f\n\r_iam_role_arnB\t\n\x07_regionB\x07\n\x05_auth\"V\n\x0cSQLExecution\x12\x19\n\x08sql_body\x18\x01 \x01(\tR\x07sqlBody\x12+\n\x11use_parameterized\x18\x02 \x01(\x08R\x10useParameterized\"8\n\x10SQLMappedColumns\x12\x12\n\x04json\x18\x01 \x01(\tR\x04json\x12\x10\n\x03sql\x18\x02 \x01(\tR\x03sql\"\xf0\x03\n\x10SSHConfiguration\x12Z\n\x15\x61uthentication_method\x18\x01 \x01(\x0e\x32 .plugins.common.v1.SSHAuthMethodH\x00R\x14\x61uthenticationMethod\x88\x01\x01\x12\x1d\n\x07\x65nabled\x18\x02 \x01(\x08H\x01R\x07\x65nabled\x88\x01\x01\x12\x17\n\x04host\x18\x03 \x01(\tH\x02R\x04host\x88\x01\x01\x12#\n\npassphrase\x18\x04 \x01(\tH\x03R\npassphrase\x88\x01\x01\x12\x1f\n\x08password\x18\x05 \x01(\tH\x04R\x08password\x88\x01\x01\x12\x17\n\x04port\x18\x06 \x01(\x05H\x05R\x04port\x88\x01\x01\x12$\n\x0bprivate_key\x18\x07 \x01(\tH\x06R\nprivateKey\x88\x01\x01\x12\"\n\npublic_key\x18\x08 \x01(\tH\x07R\tpublicKey\x88\x01\x01\x12\x1f\n\x08username\x18\t \x01(\tH\x08R\x08username\x88\x01\x01\x42\x18\n\x16_authentication_methodB\n\n\x08_enabledB\x07\n\x05_hostB\r\n\x0b_passphraseB\x0b\n\t_passwordB\x07\n\x05_portB\x0e\n\x0c_private_keyB\r\n\x0b_public_keyB\x0b\n\t_username\"\xf6\x04\n\x0bSQLBulkEdit\x12Z\n\rmatching_mode\x18\x01 \x01(\x0e\x32\".plugins.common.v1.SQLMatchingModeB\x0c\xbaH\t\x82\x01\x06\x10\x01\x1a\x02\x01\x02H\x00R\x0cmatchingMode\x88\x01\x01\x12\x1b\n\x06schema\x18\x02 \x01(\tH\x01R\x06schema\x88\x01\x01\x12\x19\n\x05table\x18\x03 \x01(\tH\x02R\x05table\x88\x01\x01\x12&\n\x0cupdated_rows\x18\x04 \x01(\tH\x03R\x0bupdatedRows\x88\x01\x01\x12\x1e\n\x08old_rows\x18\x05 \x01(\tH\x04R\x07oldRows\x88\x01\x01\x12\x1b\n\tfilter_by\x18\x06 \x03(\tR\x08\x66ilterBy\x12W\n\x0cmapping_mode\x18\x07 \x01(\x0e\x32!.plugins.common.v1.SQLMappingModeB\x0c\xbaH\t\x82\x01\x06\x10\x01\x1a\x02\x01\x02H\x05R\x0bmappingMode\x88\x01\x01\x12J\n\x0emapped_columns\x18\x08 \x03(\x0b\x32#.plugins.common.v1.SQLMappedColumnsR\rmappedColumns\x12(\n\rinserted_rows\x18\t \x01(\tH\x06R\x0cinsertedRows\x88\x01\x01\x12&\n\x0c\x64\x65leted_rows\x18\n \x01(\tH\x07R\x0b\x64\x65letedRows\x88\x01\x01\x42\x10\n\x0e_matching_modeB\t\n\x07_schemaB\x08\n\x06_tableB\x0f\n\r_updated_rowsB\x0b\n\t_old_rowsB\x0f\n\r_mapping_modeB\x10\n\x0e_inserted_rowsB\x0f\n\r_deleted_rows*\xba\x01\n\rSSHAuthMethod\x12\x1f\n\x1bSSH_AUTH_METHOD_UNSPECIFIED\x10\x00\x12\x1c\n\x18SSH_AUTH_METHOD_PASSWORD\x10\x01\x12\x1f\n\x1bSSH_AUTH_METHOD_PUB_KEY_RSA\x10\x02\x12#\n\x1fSSH_AUTH_METHOD_PUB_KEY_ED25519\x10\x03\x12$\n SSH_AUTH_METHOD_USER_PRIVATE_KEY\x10\x04*j\n\x0eSQLMappingMode\x12 \n\x1cSQL_MAPPING_MODE_UNSPECIFIED\x10\x00\x12\x19\n\x15SQL_MAPPING_MODE_AUTO\x10\x01\x12\x1b\n\x17SQL_MAPPING_MODE_MANUAL\x10\x02*p\n\x0fSQLMatchingMode\x12!\n\x1dSQL_MATCHING_MODE_UNSPECIFIED\x10\x00\x12\x1a\n\x16SQL_MATCHING_MODE_AUTO\x10\x01\x12\x1e\n\x1aSQL_MATCHING_MODE_ADVANCED\x10\x02*g\n\x0cSQLOperation\x12\x1d\n\x19SQL_OPERATION_UNSPECIFIED\x10\x00\x12\x19\n\x15SQL_OPERATION_RUN_SQL\x10\x01\x12\x1d\n\x19SQL_OPERATION_UPDATE_ROWS\x10\x02\x42\x41Z?github.com/superblocksteam/agent/types/gen/go/plugins/common/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'plugins.common.v1.plugin_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z?github.com/superblocksteam/agent/types/gen/go/plugins/common/v1'
  _globals['_SQLBULKEDIT'].fields_by_name['matching_mode']._loaded_options = None
  _globals['_SQLBULKEDIT'].fields_by_name['matching_mode']._serialized_options = b'\272H\t\202\001\006\020\001\032\002\001\002'
  _globals['_SQLBULKEDIT'].fields_by_name['mapping_mode']._loaded_options = None
  _globals['_SQLBULKEDIT'].fields_by_name['mapping_mode']._serialized_options = b'\272H\t\202\001\006\020\001\032\002\001\002'
  _globals['_SSHAUTHMETHOD']._serialized_start=1788
  _globals['_SSHAUTHMETHOD']._serialized_end=1974
  _globals['_SQLMAPPINGMODE']._serialized_start=1976
  _globals['_SQLMAPPINGMODE']._serialized_end=2082
  _globals['_SQLMATCHINGMODE']._serialized_start=2084
  _globals['_SQLMATCHINGMODE']._serialized_end=2196
  _globals['_SQLOPERATION']._serialized_start=2198
  _globals['_SQLOPERATION']._serialized_end=2301
  _globals['_DYNAMICWORKFLOWCONFIGURATION']._serialized_start=82
  _globals['_DYNAMICWORKFLOWCONFIGURATION']._serialized_end=209
  _globals['_AWSCONFIG']._serialized_start=212
  _globals['_AWSCONFIG']._serialized_end=507
  _globals['_AWSCONFIG_AUTH']._serialized_start=315
  _globals['_AWSCONFIG_AUTH']._serialized_end=487
  _globals['_SQLEXECUTION']._serialized_start=509
  _globals['_SQLEXECUTION']._serialized_end=595
  _globals['_SQLMAPPEDCOLUMNS']._serialized_start=597
  _globals['_SQLMAPPEDCOLUMNS']._serialized_end=653
  _globals['_SSHCONFIGURATION']._serialized_start=656
  _globals['_SSHCONFIGURATION']._serialized_end=1152
  _globals['_SQLBULKEDIT']._serialized_start=1155
  _globals['_SQLBULKEDIT']._serialized_end=1785
# @@protoc_insertion_point(module_scope)