# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: store/v1/service.proto
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
    'store/v1/service.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from superblocks_types.common.v1 import errors_pb2 as common_dot_v1_dot_errors__pb2
from superblocks_types.google.api import annotations_pb2 as google_dot_api_dot_annotations__pb2
from google.protobuf import struct_pb2 as google_dot_protobuf_dot_struct__pb2
from superblocks_types.protoc_gen_openapiv2.options import annotations_pb2 as protoc__gen__openapiv2_dot_options_dot_annotations__pb2
from superblocks_types.store.v1 import store_pb2 as store_dot_v1_dot_store__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x16store/v1/service.proto\x12\x08store.v1\x1a\x16\x63ommon/v1/errors.proto\x1a\x1cgoogle/api/annotations.proto\x1a\x1cgoogle/protobuf/struct.proto\x1a.protoc-gen-openapiv2/options/annotations.proto\x1a\x14store/v1/store.proto\"!\n\x0bReadRequest\x12\x12\n\x04keys\x18\x01 \x03(\tR\x04keys\"h\n\x0cReadResponse\x12\x30\n\x07results\x18\x01 \x03(\x0b\x32\x16.google.protobuf.ValueR\x07results\x12&\n\x05\x65rror\x18\x02 \x01(\x0b\x32\x10.common.v1.ErrorR\x05\x65rror\"4\n\x0cWriteRequest\x12$\n\x05pairs\x18\x01 \x03(\x0b\x32\x0e.store.v1.PairR\x05pairs\"]\n\rWriteResponse\x12$\n\x05pairs\x18\x01 \x03(\x0b\x32\x0e.store.v1.PairR\x05pairs\x12&\n\x05\x65rror\x18\x02 \x01(\x0b\x32\x10.common.v1.ErrorR\x05\x65rror2\xbd\x01\n\x0cStoreService\x12S\n\x04Read\x12\x15.store.v1.ReadRequest\x1a\x16.store.v1.ReadResponse\"\x1c\x92\x41\x06*\x04Read\x82\xd3\xe4\x93\x02\r\"\x08/v1/read:\x01*\x12X\n\x05Write\x12\x16.store.v1.WriteRequest\x1a\x17.store.v1.WriteResponse\"\x1e\x92\x41\x07*\x05Write\x82\xd3\xe4\x93\x02\x0e\"\t/v1/write:\x01*B|Z6github.com/superblocksteam/agent/types/gen/go/store/v1\x92\x41\x41\x12\x18\n\x11Superblocks Store2\x03\x31.0*\x01\x02\x32\x10\x61pplication/json:\x10\x61pplication/jsonb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'store.v1.service_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z6github.com/superblocksteam/agent/types/gen/go/store/v1\222AA\022\030\n\021Superblocks Store2\0031.0*\001\0022\020application/json:\020application/json'
  _globals['_STORESERVICE'].methods_by_name['Read']._loaded_options = None
  _globals['_STORESERVICE'].methods_by_name['Read']._serialized_options = b'\222A\006*\004Read\202\323\344\223\002\r\"\010/v1/read:\001*'
  _globals['_STORESERVICE'].methods_by_name['Write']._loaded_options = None
  _globals['_STORESERVICE'].methods_by_name['Write']._serialized_options = b'\222A\007*\005Write\202\323\344\223\002\016\"\t/v1/write:\001*'
  _globals['_READREQUEST']._serialized_start=190
  _globals['_READREQUEST']._serialized_end=223
  _globals['_READRESPONSE']._serialized_start=225
  _globals['_READRESPONSE']._serialized_end=329
  _globals['_WRITEREQUEST']._serialized_start=331
  _globals['_WRITEREQUEST']._serialized_end=383
  _globals['_WRITERESPONSE']._serialized_start=385
  _globals['_WRITERESPONSE']._serialized_end=478
  _globals['_STORESERVICE']._serialized_start=481
  _globals['_STORESERVICE']._serialized_end=670
# @@protoc_insertion_point(module_scope)
