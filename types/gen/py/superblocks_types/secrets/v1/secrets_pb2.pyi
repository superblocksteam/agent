from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import common_pb2 as _common_pb2
from plugins.common.v1 import auth_pb2 as _auth_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class AwsSecretsManager(_message.Message):
    __slots__ = ("auth", "prefix")
    AUTH_FIELD_NUMBER: _ClassVar[int]
    PREFIX_FIELD_NUMBER: _ClassVar[int]
    auth: _auth_pb2.AwsAuth
    prefix: str
    def __init__(self, auth: _Optional[_Union[_auth_pb2.AwsAuth, _Mapping]] = ..., prefix: _Optional[str] = ...) -> None: ...

class GcpSecretManager(_message.Message):
    __slots__ = ("auth", "project_id")
    AUTH_FIELD_NUMBER: _ClassVar[int]
    PROJECT_ID_FIELD_NUMBER: _ClassVar[int]
    auth: _auth_pb2.GcpAuth
    project_id: str
    def __init__(self, auth: _Optional[_Union[_auth_pb2.GcpAuth, _Mapping]] = ..., project_id: _Optional[str] = ...) -> None: ...

class AkeylessSecretsManager(_message.Message):
    __slots__ = ("auth", "host", "prefix")
    AUTH_FIELD_NUMBER: _ClassVar[int]
    HOST_FIELD_NUMBER: _ClassVar[int]
    PREFIX_FIELD_NUMBER: _ClassVar[int]
    auth: _auth_pb2.AkeylessAuth
    host: str
    prefix: str
    def __init__(self, auth: _Optional[_Union[_auth_pb2.AkeylessAuth, _Mapping]] = ..., host: _Optional[str] = ..., prefix: _Optional[str] = ...) -> None: ...

class HashicorpVault(_message.Message):
    __slots__ = ("auth", "address", "path", "namespace", "version", "secrets_path")
    class Version(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        VERSION_UNSPECIFIED: _ClassVar[HashicorpVault.Version]
        VERSION_V1: _ClassVar[HashicorpVault.Version]
        VERSION_V2: _ClassVar[HashicorpVault.Version]
    VERSION_UNSPECIFIED: HashicorpVault.Version
    VERSION_V1: HashicorpVault.Version
    VERSION_V2: HashicorpVault.Version
    class Auth(_message.Message):
        __slots__ = ("token", "app_role")
        class AppRole(_message.Message):
            __slots__ = ("role_id", "secret_id")
            ROLE_ID_FIELD_NUMBER: _ClassVar[int]
            SECRET_ID_FIELD_NUMBER: _ClassVar[int]
            role_id: str
            secret_id: str
            def __init__(self, role_id: _Optional[str] = ..., secret_id: _Optional[str] = ...) -> None: ...
        TOKEN_FIELD_NUMBER: _ClassVar[int]
        APP_ROLE_FIELD_NUMBER: _ClassVar[int]
        token: str
        app_role: HashicorpVault.Auth.AppRole
        def __init__(self, token: _Optional[str] = ..., app_role: _Optional[_Union[HashicorpVault.Auth.AppRole, _Mapping]] = ...) -> None: ...
    AUTH_FIELD_NUMBER: _ClassVar[int]
    ADDRESS_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    NAMESPACE_FIELD_NUMBER: _ClassVar[int]
    VERSION_FIELD_NUMBER: _ClassVar[int]
    SECRETS_PATH_FIELD_NUMBER: _ClassVar[int]
    auth: HashicorpVault.Auth
    address: str
    path: str
    namespace: str
    version: HashicorpVault.Version
    secrets_path: str
    def __init__(self, auth: _Optional[_Union[HashicorpVault.Auth, _Mapping]] = ..., address: _Optional[str] = ..., path: _Optional[str] = ..., namespace: _Optional[str] = ..., version: _Optional[_Union[HashicorpVault.Version, str]] = ..., secrets_path: _Optional[str] = ...) -> None: ...

class MockStore(_message.Message):
    __slots__ = ("data",)
    class DataEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    DATA_FIELD_NUMBER: _ClassVar[int]
    data: _containers.ScalarMap[str, str]
    def __init__(self, data: _Optional[_Mapping[str, str]] = ...) -> None: ...

class Provider(_message.Message):
    __slots__ = ("mock", "akeyless_secrets_manager", "aws_secrets_manager", "gcp_secret_manager", "hashicorp_vault")
    MOCK_FIELD_NUMBER: _ClassVar[int]
    AKEYLESS_SECRETS_MANAGER_FIELD_NUMBER: _ClassVar[int]
    AWS_SECRETS_MANAGER_FIELD_NUMBER: _ClassVar[int]
    GCP_SECRET_MANAGER_FIELD_NUMBER: _ClassVar[int]
    HASHICORP_VAULT_FIELD_NUMBER: _ClassVar[int]
    mock: MockStore
    akeyless_secrets_manager: AkeylessSecretsManager
    aws_secrets_manager: AwsSecretsManager
    gcp_secret_manager: GcpSecretManager
    hashicorp_vault: HashicorpVault
    def __init__(self, mock: _Optional[_Union[MockStore, _Mapping]] = ..., akeyless_secrets_manager: _Optional[_Union[AkeylessSecretsManager, _Mapping]] = ..., aws_secrets_manager: _Optional[_Union[AwsSecretsManager, _Mapping]] = ..., gcp_secret_manager: _Optional[_Union[GcpSecretManager, _Mapping]] = ..., hashicorp_vault: _Optional[_Union[HashicorpVault, _Mapping]] = ...) -> None: ...

class Store(_message.Message):
    __slots__ = ("metadata", "provider", "ttl", "configuration_id", "cache")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    PROVIDER_FIELD_NUMBER: _ClassVar[int]
    TTL_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    CACHE_FIELD_NUMBER: _ClassVar[int]
    metadata: _common_pb2.Metadata
    provider: Provider
    ttl: int
    configuration_id: str
    cache: bool
    def __init__(self, metadata: _Optional[_Union[_common_pb2.Metadata, _Mapping]] = ..., provider: _Optional[_Union[Provider, _Mapping]] = ..., ttl: _Optional[int] = ..., configuration_id: _Optional[str] = ..., cache: bool = ...) -> None: ...

class Details(_message.Message):
    __slots__ = ("alias", "name")
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    alias: str
    name: str
    def __init__(self, alias: _Optional[str] = ..., name: _Optional[str] = ...) -> None: ...

class Invalidation(_message.Message):
    __slots__ = ("alias", "configuration_id", "store")
    ALIAS_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    STORE_FIELD_NUMBER: _ClassVar[int]
    alias: str
    configuration_id: str
    store: str
    def __init__(self, alias: _Optional[str] = ..., configuration_id: _Optional[str] = ..., store: _Optional[str] = ...) -> None: ...
