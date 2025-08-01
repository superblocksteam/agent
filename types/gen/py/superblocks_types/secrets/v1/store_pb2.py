# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: secrets/v1/store.proto
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
    'secrets/v1/store.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from superblocks_types.buf.validate import validate_pb2 as buf_dot_validate_dot_validate__pb2
from superblocks_types.common.v1 import common_pb2 as common_dot_v1_dot_common__pb2
from superblocks_types.common.v1 import errors_pb2 as common_dot_v1_dot_errors__pb2
from superblocks_types.google.api import annotations_pb2 as google_dot_api_dot_annotations__pb2
from superblocks_types.secrets.v1 import secrets_pb2 as secrets_dot_v1_dot_secrets__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x16secrets/v1/store.proto\x12\nsecrets.v1\x1a\x1b\x62uf/validate/validate.proto\x1a\x16\x63ommon/v1/common.proto\x1a\x16\x63ommon/v1/errors.proto\x1a\x1cgoogle/api/annotations.proto\x1a\x18secrets/v1/secrets.proto\"u\n\x11InvalidateRequest\x12\x1d\n\x05store\x18\x01 \x01(\tB\x07\xbaH\x04r\x02\x10\x01R\x05store\x12\x16\n\x06secret\x18\x02 \x01(\tR\x06secret\x12)\n\x10\x63onfiguration_id\x18\x03 \x01(\tR\x0f\x63onfigurationId\"\x98\x01\n\x12InvalidateResponse\x12(\n\x06\x65rrors\x18\x01 \x03(\x0b\x32\x10.common.v1.ErrorR\x06\x65rrors\x12>\n\rinvalidations\x18\x02 \x03(\x0b\x32\x18.secrets.v1.InvalidationR\rinvalidations\x12\x18\n\x07message\x18\x03 \x01(\tR\x07message\"\xad\x01\n\x12ListSecretsRequest\x12\x1d\n\x05store\x18\x01 \x01(\tB\x07\xbaH\x04r\x02\x10\x01R\x05store\x12\x34\n\x07profile\x18\x02 \x01(\x0b\x32\x12.common.v1.ProfileB\x06\xbaH\x03\xc8\x01\x01R\x07profile\x12\x35\n\x08provider\x18\x03 \x01(\x0b\x32\x14.secrets.v1.ProviderH\x00R\x08provider\x88\x01\x01\x42\x0b\n\t_provider\"D\n\x13ListSecretsResponse\x12-\n\x07secrets\x18\x01 \x03(\x0b\x32\x13.secrets.v1.DetailsR\x07secrets2\xcd\x03\n\x0cStoreService\x12\xa6\x02\n\nInvalidate\x12\x1d.secrets.v1.InvalidateRequest\x1a\x1e.secrets.v1.InvalidateResponse\"\xd8\x01\x82\xd3\xe4\x93\x02\xd1\x01\"%/v1/secrets/stores/{store}/invalidate:\x01*ZI\"G/v1/secrets/stores/{store}/configurations/{configuration_id}/invalidateZZ\"X/v1/secrets/stores/{store}/configurations/{configuration_id}/secrets/{secret}/invalidate\x12\x93\x01\n\x0bListSecrets\x12\x1e.secrets.v1.ListSecretsRequest\x1a\x1f.secrets.v1.ListSecretsResponse\"C\x82\xd3\xe4\x93\x02=\x12\x1a/v1/secrets/stores/{store}Z\x1f\"\x1a/v1/secrets/stores/{store}:\x01*B:Z8github.com/superblocksteam/agent/types/gen/go/secrets/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'secrets.v1.store_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z8github.com/superblocksteam/agent/types/gen/go/secrets/v1'
  _globals['_INVALIDATEREQUEST'].fields_by_name['store']._loaded_options = None
  _globals['_INVALIDATEREQUEST'].fields_by_name['store']._serialized_options = b'\272H\004r\002\020\001'
  _globals['_LISTSECRETSREQUEST'].fields_by_name['store']._loaded_options = None
  _globals['_LISTSECRETSREQUEST'].fields_by_name['store']._serialized_options = b'\272H\004r\002\020\001'
  _globals['_LISTSECRETSREQUEST'].fields_by_name['profile']._loaded_options = None
  _globals['_LISTSECRETSREQUEST'].fields_by_name['profile']._serialized_options = b'\272H\003\310\001\001'
  _globals['_STORESERVICE'].methods_by_name['Invalidate']._loaded_options = None
  _globals['_STORESERVICE'].methods_by_name['Invalidate']._serialized_options = b'\202\323\344\223\002\321\001\"%/v1/secrets/stores/{store}/invalidate:\001*ZI\"G/v1/secrets/stores/{store}/configurations/{configuration_id}/invalidateZZ\"X/v1/secrets/stores/{store}/configurations/{configuration_id}/secrets/{secret}/invalidate'
  _globals['_STORESERVICE'].methods_by_name['ListSecrets']._loaded_options = None
  _globals['_STORESERVICE'].methods_by_name['ListSecrets']._serialized_options = b'\202\323\344\223\002=\022\032/v1/secrets/stores/{store}Z\037\"\032/v1/secrets/stores/{store}:\001*'
  _globals['_INVALIDATEREQUEST']._serialized_start=171
  _globals['_INVALIDATEREQUEST']._serialized_end=288
  _globals['_INVALIDATERESPONSE']._serialized_start=291
  _globals['_INVALIDATERESPONSE']._serialized_end=443
  _globals['_LISTSECRETSREQUEST']._serialized_start=446
  _globals['_LISTSECRETSREQUEST']._serialized_end=619
  _globals['_LISTSECRETSRESPONSE']._serialized_start=621
  _globals['_LISTSECRETSRESPONSE']._serialized_end=689
  _globals['_STORESERVICE']._serialized_start=692
  _globals['_STORESERVICE']._serialized_end=1153
# @@protoc_insertion_point(module_scope)
