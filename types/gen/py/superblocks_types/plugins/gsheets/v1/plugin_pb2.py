# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: plugins/gsheets/v1/plugin.proto
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
    'plugins/gsheets/v1/plugin.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1fplugins/gsheets/v1/plugin.proto\x12\x12plugins.gsheets.v1\";\n\x13SuperblocksMetadata\x12$\n\rpluginVersion\x18\x01 \x01(\tR\rpluginVersion\"\xb7\x07\n\x06Plugin\x12$\n\rspreadsheetId\x18\x01 \x01(\tR\rspreadsheetId\x12#\n\nsheetTitle\x18\x02 \x01(\tH\x00R\nsheetTitle\x88\x01\x01\x12\x19\n\x05range\x18\x03 \x01(\tH\x01R\x05range\x88\x01\x01\x12!\n\trowNumber\x18\x04 \x01(\tH\x02R\trowNumber\x88\x01\x01\x12\x34\n\x15\x65xtractFirstRowHeader\x18\x05 \x01(\x08R\x15\x65xtractFirstRowHeader\x12-\n\x0fheaderRowNumber\x18\x06 \x01(\tH\x03R\x0fheaderRowNumber\x88\x01\x01\x12\x1b\n\x06\x66ormat\x18\x07 \x01(\tH\x04R\x06\x66ormat\x88\x01\x01\x12\x17\n\x04\x64\x61ta\x18\x08 \x01(\tH\x05R\x04\x64\x61ta\x88\x01\x01\x12,\n\x11preserveHeaderRow\x18\t \x01(\x08R\x11preserveHeaderRow\x12*\n\x10includeHeaderRow\x18\n \x01(\x08R\x10includeHeaderRow\x12\x1b\n\x06\x61\x63tion\x18\x0b \x01(\tH\x06R\x06\x61\x63tion\x88\x01\x01\x12;\n\x16writeToDestinationType\x18\x0c \x01(\tH\x07R\x16writeToDestinationType\x88\x01\x01\x12\x17\n\x04\x62ody\x18\r \x01(\tH\x08R\x04\x62ody\x88\x01\x01\x12Y\n\x13superblocksMetadata\x18\x0e \x01(\x0b\x32\'.plugins.gsheets.v1.SuperblocksMetadataR\x13superblocksMetadata\x12\x44\n\x08\x61\x64\x64Sheet\x18\x0f \x01(\x0b\x32#.plugins.gsheets.v1.Plugin.AddSheetH\tR\x08\x61\x64\x64Sheet\x88\x01\x01\x1a\x8f\x01\n\x08\x41\x64\x64Sheet\x12\x1e\n\nsheetTitle\x18\x01 \x01(\tR\nsheetTitle\x12\x1f\n\x08rowCount\x18\x02 \x01(\tH\x00R\x08rowCount\x88\x01\x01\x12%\n\x0b\x63olumnCount\x18\x03 \x01(\tH\x01R\x0b\x63olumnCount\x88\x01\x01\x42\x0b\n\t_rowCountB\x0e\n\x0c_columnCountB\r\n\x0b_sheetTitleB\x08\n\x06_rangeB\x0c\n\n_rowNumberB\x12\n\x10_headerRowNumberB\t\n\x07_formatB\x07\n\x05_dataB\t\n\x07_actionB\x19\n\x17_writeToDestinationTypeB\x07\n\x05_bodyB\x0b\n\t_addSheetBBZ@github.com/superblocksteam/agent/types/gen/go/plugins/gsheets/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'plugins.gsheets.v1.plugin_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z@github.com/superblocksteam/agent/types/gen/go/plugins/gsheets/v1'
  _globals['_SUPERBLOCKSMETADATA']._serialized_start=55
  _globals['_SUPERBLOCKSMETADATA']._serialized_end=114
  _globals['_PLUGIN']._serialized_start=117
  _globals['_PLUGIN']._serialized_end=1068
  _globals['_PLUGIN_ADDSHEET']._serialized_start=786
  _globals['_PLUGIN_ADDSHEET']._serialized_end=929
# @@protoc_insertion_point(module_scope)
