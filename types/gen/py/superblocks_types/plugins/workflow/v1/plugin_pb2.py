# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: plugins/workflow/v1/plugin.proto
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
    'plugins/workflow/v1/plugin.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from superblocks_types.common.v1 import plugin_pb2 as common_dot_v1_dot_plugin__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n plugins/workflow/v1/plugin.proto\x12\x13plugins.workflow.v1\x1a\x16\x63ommon/v1/plugin.proto\"/\n\x05Tuple\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n\x05value\x18\x02 \x01(\tR\x05value\"\xac\x03\n\x06Plugin\x12\x1a\n\x08workflow\x18\x01 \x01(\tR\x08workflow\x12?\n\x06\x63ustom\x18\x02 \x03(\x0b\x32\'.plugins.workflow.v1.Plugin.CustomEntryR\x06\x63ustom\x12N\n\x0bqueryParams\x18\x03 \x03(\x0b\x32,.plugins.workflow.v1.Plugin.QueryParamsEntryR\x0bqueryParams\x12P\n\x13superblocksMetadata\x18\x0c \x01(\x0b\x32\x1e.common.v1.SuperblocksMetadataR\x13superblocksMetadata\x1aN\n\x0b\x43ustomEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12)\n\x05value\x18\x02 \x01(\x0b\x32\x13.common.v1.PropertyR\x05value:\x02\x38\x01\x1aS\n\x10QueryParamsEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12)\n\x05value\x18\x02 \x01(\x0b\x32\x13.common.v1.PropertyR\x05value:\x02\x38\x01\x42\x43ZAgithub.com/superblocksteam/agent/types/gen/go/plugins/workflow/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'plugins.workflow.v1.plugin_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'ZAgithub.com/superblocksteam/agent/types/gen/go/plugins/workflow/v1'
  _globals['_PLUGIN_CUSTOMENTRY']._loaded_options = None
  _globals['_PLUGIN_CUSTOMENTRY']._serialized_options = b'8\001'
  _globals['_PLUGIN_QUERYPARAMSENTRY']._loaded_options = None
  _globals['_PLUGIN_QUERYPARAMSENTRY']._serialized_options = b'8\001'
  _globals['_TUPLE']._serialized_start=81
  _globals['_TUPLE']._serialized_end=128
  _globals['_PLUGIN']._serialized_start=131
  _globals['_PLUGIN']._serialized_end=559
  _globals['_PLUGIN_CUSTOMENTRY']._serialized_start=396
  _globals['_PLUGIN_CUSTOMENTRY']._serialized_end=474
  _globals['_PLUGIN_QUERYPARAMSENTRY']._serialized_start=476
  _globals['_PLUGIN_QUERYPARAMSENTRY']._serialized_end=559
# @@protoc_insertion_point(module_scope)
