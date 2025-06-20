# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: plugins/common/v1/auth.proto
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
    'plugins/common/v1/auth.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1cplugins/common/v1/auth.proto\x12\x11plugins.common.v1\"\x9e\x01\n\x0bOAuthCommon\x12\x1b\n\tclient_id\x18\x01 \x01(\tR\x08\x63lientId\x12#\n\rclient_secret\x18\x02 \x01(\tR\x0c\x63lientSecret\x12\x1b\n\ttoken_url\x18\x03 \x01(\tR\x08tokenUrl\x12\x1a\n\x08\x61udience\x18\x04 \x01(\tR\x08\x61udience\x12\x14\n\x05scope\x18\x05 \x01(\tR\x05scope\"\xb6\x08\n\x05OAuth\x1a\xdc\x01\n\x11PasswordGrantFlow\x12\x1b\n\tclient_id\x18\x01 \x01(\tR\x08\x63lientId\x12#\n\rclient_secret\x18\x02 \x01(\tR\x0c\x63lientSecret\x12\x1b\n\ttoken_url\x18\x03 \x01(\tR\x08tokenUrl\x12\x1a\n\x08username\x18\x04 \x01(\tR\x08username\x12\x1a\n\x08password\x18\x05 \x01(\tR\x08password\x12\x1a\n\x08\x61udience\x18\x06 \x01(\tR\x08\x61udience\x12\x14\n\x05scope\x18\x07 \x01(\tR\x05scope\x1a\xa8\x01\n\x15\x43lientCredentialsFlow\x12\x1b\n\tclient_id\x18\x01 \x01(\tR\x08\x63lientId\x12#\n\rclient_secret\x18\x02 \x01(\tR\x0c\x63lientSecret\x12\x1b\n\ttoken_url\x18\x03 \x01(\tR\x08tokenUrl\x12\x1a\n\x08\x61udience\x18\x04 \x01(\tR\x08\x61udience\x12\x14\n\x05scope\x18\x05 \x01(\tR\x05scope\x1a\xa2\x05\n\x15\x41uthorizationCodeFlow\x12\x1b\n\tclient_id\x18\x01 \x01(\tR\x08\x63lientId\x12#\n\rclient_secret\x18\x02 \x01(\tR\x0c\x63lientSecret\x12\x1b\n\ttoken_url\x18\x03 \x01(\tR\x08tokenUrl\x12\x19\n\x08\x61uth_url\x18\x04 \x01(\tR\x07\x61uthUrl\x12\x1a\n\x08\x61udience\x18\x05 \x01(\tR\x08\x61udience\x12\x14\n\x05scope\x18\x06 \x01(\tR\x05scope\x12\x1f\n\x0btoken_scope\x18\x07 \x01(\tR\ntokenScope\x12\x39\n\x19refresh_token_from_server\x18\x08 \x01(\x08R\x16refreshTokenFromServer\x12,\n\x12\x63lient_auth_method\x18\t \x01(\tR\x10\x63lientAuthMethod\x12s\n\x14subject_token_source\x18\n \x01(\x0e\x32\x41.plugins.common.v1.OAuth.AuthorizationCodeFlow.SubjectTokenSourceR\x12subjectTokenSource\x12H\n!subject_token_source_static_token\x18\x0b \x01(\tR\x1dsubjectTokenSourceStaticToken\"\x93\x01\n\x12SubjectTokenSource\x12$\n SUBJECT_TOKEN_SOURCE_UNSPECIFIED\x10\x00\x12\x30\n,SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER\x10\x01\x12%\n!SUBJECT_TOKEN_SOURCE_STATIC_TOKEN\x10\x02\"?\n\x05\x42\x61sic\x12\x1a\n\x08username\x18\x01 \x01(\tR\x08username\x12\x1a\n\x08password\x18\x02 \x01(\tR\x08password\"\x9d\x02\n\x05\x41zure\x12\x30\n\x03key\x18\x01 \x01(\x0b\x32\x1c.plugins.common.v1.Azure.KeyH\x00R\x03key\x12[\n\x12\x63lient_credentials\x18\x02 \x01(\x0b\x32*.plugins.common.v1.Azure.ClientCredentialsH\x00R\x11\x63lientCredentials\x1a$\n\x03Key\x12\x1d\n\nmaster_key\x18\x01 \x01(\tR\tmasterKey\x1aU\n\x11\x43lientCredentials\x12\x1b\n\tclient_id\x18\x01 \x01(\tR\x08\x63lientId\x12#\n\rclient_secret\x18\x02 \x01(\tR\x0c\x63lientSecretB\x08\n\x06\x63onfig\"\xb5\x02\n\x07\x41wsAuth\x12;\n\x06static\x18\x01 \x01(\x0b\x32!.plugins.common.v1.AwsAuth.StaticH\x00R\x06static\x12H\n\x0b\x61ssume_role\x18\x02 \x01(\x0b\x32%.plugins.common.v1.AwsAuth.AssumeRoleH\x00R\nassumeRole\x12\x16\n\x06region\x18\x03 \x01(\tR\x06region\x1aX\n\x06Static\x12\"\n\raccess_key_id\x18\x01 \x01(\tR\x0b\x61\x63\x63\x65ssKeyId\x12*\n\x11secret_access_key\x18\x02 \x01(\tR\x0fsecretAccessKey\x1a\'\n\nAssumeRole\x12\x19\n\x08role_arn\x18\x03 \x01(\tR\x07roleArnB\x08\n\x06\x63onfig\">\n\x07GcpAuth\x12)\n\x0fservice_account\x18\x01 \x01(\x0cH\x00R\x0eserviceAccountB\x08\n\x06\x63onfig\"\x9b\x02\n\x0c\x41keylessAuth\x12\x41\n\x07\x61pi_key\x18\x01 \x01(\x0b\x32&.plugins.common.v1.AkeylessAuth.ApiKeyH\x00R\x06\x61piKey\x12=\n\x05\x65mail\x18\x02 \x01(\x0b\x32%.plugins.common.v1.AkeylessAuth.EmailH\x00R\x05\x65mail\x1a\x44\n\x06\x41piKey\x12\x1b\n\taccess_id\x18\x01 \x01(\tR\x08\x61\x63\x63\x65ssId\x12\x1d\n\naccess_key\x18\x02 \x01(\tR\taccessKey\x1a\x39\n\x05\x45mail\x12\x14\n\x05\x65mail\x18\x01 \x01(\tR\x05\x65mail\x12\x1a\n\x08password\x18\x02 \x01(\tR\x08passwordB\x08\n\x06\x63onfig\"\xa6\x03\n\x04\x41uth\x12\\\n\x13password_grant_flow\x18\x01 \x01(\x0b\x32*.plugins.common.v1.OAuth.PasswordGrantFlowH\x00R\x11passwordGrantFlow\x12h\n\x17\x61uthorization_code_flow\x18\x02 \x01(\x0b\x32..plugins.common.v1.OAuth.AuthorizationCodeFlowH\x00R\x15\x61uthorizationCodeFlow\x12\x30\n\x05\x62\x61sic\x18\x03 \x01(\x0b\x32\x18.plugins.common.v1.BasicH\x00R\x05\x62\x61sic\x12h\n\x17\x63lient_credentials_flow\x18\x04 \x01(\x0b\x32..plugins.common.v1.OAuth.ClientCredentialsFlowH\x00R\x15\x63lientCredentialsFlow\x12\x30\n\x03key\x18\x05 \x01(\x0b\x32\x1c.plugins.common.v1.Azure.KeyH\x00R\x03keyB\x08\n\x06methodBAZ?github.com/superblocksteam/agent/types/gen/go/plugins/common/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'plugins.common.v1.auth_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z?github.com/superblocksteam/agent/types/gen/go/plugins/common/v1'
  _globals['_OAUTHCOMMON']._serialized_start=52
  _globals['_OAUTHCOMMON']._serialized_end=210
  _globals['_OAUTH']._serialized_start=213
  _globals['_OAUTH']._serialized_end=1291
  _globals['_OAUTH_PASSWORDGRANTFLOW']._serialized_start=223
  _globals['_OAUTH_PASSWORDGRANTFLOW']._serialized_end=443
  _globals['_OAUTH_CLIENTCREDENTIALSFLOW']._serialized_start=446
  _globals['_OAUTH_CLIENTCREDENTIALSFLOW']._serialized_end=614
  _globals['_OAUTH_AUTHORIZATIONCODEFLOW']._serialized_start=617
  _globals['_OAUTH_AUTHORIZATIONCODEFLOW']._serialized_end=1291
  _globals['_OAUTH_AUTHORIZATIONCODEFLOW_SUBJECTTOKENSOURCE']._serialized_start=1144
  _globals['_OAUTH_AUTHORIZATIONCODEFLOW_SUBJECTTOKENSOURCE']._serialized_end=1291
  _globals['_BASIC']._serialized_start=1293
  _globals['_BASIC']._serialized_end=1356
  _globals['_AZURE']._serialized_start=1359
  _globals['_AZURE']._serialized_end=1644
  _globals['_AZURE_KEY']._serialized_start=1511
  _globals['_AZURE_KEY']._serialized_end=1547
  _globals['_AZURE_CLIENTCREDENTIALS']._serialized_start=1549
  _globals['_AZURE_CLIENTCREDENTIALS']._serialized_end=1634
  _globals['_AWSAUTH']._serialized_start=1647
  _globals['_AWSAUTH']._serialized_end=1956
  _globals['_AWSAUTH_STATIC']._serialized_start=1817
  _globals['_AWSAUTH_STATIC']._serialized_end=1905
  _globals['_AWSAUTH_ASSUMEROLE']._serialized_start=1907
  _globals['_AWSAUTH_ASSUMEROLE']._serialized_end=1946
  _globals['_GCPAUTH']._serialized_start=1958
  _globals['_GCPAUTH']._serialized_end=2020
  _globals['_AKEYLESSAUTH']._serialized_start=2023
  _globals['_AKEYLESSAUTH']._serialized_end=2306
  _globals['_AKEYLESSAUTH_APIKEY']._serialized_start=2169
  _globals['_AKEYLESSAUTH_APIKEY']._serialized_end=2237
  _globals['_AKEYLESSAUTH_EMAIL']._serialized_start=2239
  _globals['_AKEYLESSAUTH_EMAIL']._serialized_end=2296
  _globals['_AUTH']._serialized_start=2309
  _globals['_AUTH']._serialized_end=2731
# @@protoc_insertion_point(module_scope)
