# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: api/v1/blocks.proto
# Protobuf Python Version: 6.31.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    6,
    31,
    1,
    '',
    'api/v1/blocks.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from superblocks_types.buf.validate import validate_pb2 as buf_dot_validate_dot_validate__pb2
from superblocks_types.validate import validate_pb2 as validate_dot_validate__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x13\x61pi/v1/blocks.proto\x12\x06\x61pi.v1\x1a\x1b\x62uf/validate/validate.proto\x1a\x17validate/validate.proto\"\x82\x03\n\tVariables\x12.\n\x05items\x18\x01 \x03(\x0b\x32\x18.api.v1.Variables.ConfigR\x05items\x1a\x9b\x01\n\x06\x43onfig\x12\x14\n\x05value\x18\x01 \x01(\tR\x05value\x12=\n\x04type\x18\x02 \x01(\x0e\x32\x16.api.v1.Variables.TypeB\x11\xfa\x42\x05\x82\x01\x02 \x00\xbaH\x06\x82\x01\x03\"\x01\x00R\x04type\x12*\n\x04mode\x18\x03 \x01(\x0e\x32\x16.api.v1.Variables.ModeR\x04mode\x12\x10\n\x03key\x18\x04 \x01(\tR\x03key\"f\n\x04Type\x12\x14\n\x10TYPE_UNSPECIFIED\x10\x00\x12\x0f\n\x0bTYPE_SIMPLE\x10\x01\x12\x11\n\rTYPE_ADVANCED\x10\x02\x12\x0f\n\x0bTYPE_NATIVE\x10\x03\x12\x13\n\x0fTYPE_FILEPICKER\x10\x04\"?\n\x04Mode\x12\x14\n\x10MODE_UNSPECIFIED\x10\x00\x12\r\n\tMODE_READ\x10\x01\x12\x12\n\x0eMODE_READWRITE\x10\x02\x42\x36Z4github.com/superblocksteam/agent/types/gen/go/api/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'api.v1.blocks_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z4github.com/superblocksteam/agent/types/gen/go/api/v1'
  _globals['_VARIABLES_CONFIG'].fields_by_name['type']._loaded_options = None
  _globals['_VARIABLES_CONFIG'].fields_by_name['type']._serialized_options = b'\372B\005\202\001\002 \000\272H\006\202\001\003\"\001\000'
  _globals['_VARIABLES']._serialized_start=86
  _globals['_VARIABLES']._serialized_end=472
  _globals['_VARIABLES_CONFIG']._serialized_start=148
  _globals['_VARIABLES_CONFIG']._serialized_end=303
  _globals['_VARIABLES_TYPE']._serialized_start=305
  _globals['_VARIABLES_TYPE']._serialized_end=407
  _globals['_VARIABLES_MODE']._serialized_start=409
  _globals['_VARIABLES_MODE']._serialized_end=472
# @@protoc_insertion_point(module_scope)
