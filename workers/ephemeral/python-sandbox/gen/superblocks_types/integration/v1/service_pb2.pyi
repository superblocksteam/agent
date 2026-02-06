from common.v1 import common_pb2 as _common_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Kind(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    KIND_UNSPECIFIED: _ClassVar[Kind]
    KIND_PLUGIN: _ClassVar[Kind]
    KIND_SECRET: _ClassVar[Kind]
KIND_UNSPECIFIED: Kind
KIND_PLUGIN: Kind
KIND_SECRET: Kind

class GetIntegrationResponse(_message.Message):
    __slots__ = ("data",)
    DATA_FIELD_NUMBER: _ClassVar[int]
    data: Integration
    def __init__(self, data: _Optional[_Union[Integration, _Mapping]] = ...) -> None: ...

class GetIntegrationsRequest(_message.Message):
    __slots__ = ("profile", "ids", "kind", "slug")
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    IDS_FIELD_NUMBER: _ClassVar[int]
    KIND_FIELD_NUMBER: _ClassVar[int]
    SLUG_FIELD_NUMBER: _ClassVar[int]
    profile: _common_pb2.Profile
    ids: _containers.RepeatedScalarFieldContainer[str]
    kind: Kind
    slug: str
    def __init__(self, profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., ids: _Optional[_Iterable[str]] = ..., kind: _Optional[_Union[Kind, str]] = ..., slug: _Optional[str] = ...) -> None: ...

class ValidateProfileRequest(_message.Message):
    __slots__ = ("profile", "view_mode", "integration_ids")
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_IDS_FIELD_NUMBER: _ClassVar[int]
    profile: _common_pb2.Profile
    view_mode: str
    integration_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., view_mode: _Optional[str] = ..., integration_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class ValidateProfileResponse(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class GetIntegrationsResponse(_message.Message):
    __slots__ = ("data",)
    DATA_FIELD_NUMBER: _ClassVar[int]
    data: _containers.RepeatedCompositeFieldContainer[Integration]
    def __init__(self, data: _Optional[_Iterable[_Union[Integration, _Mapping]]] = ...) -> None: ...

class Configuration(_message.Message):
    __slots__ = ("id", "created", "integration_id", "configuration", "is_default", "profile_ids")
    ID_FIELD_NUMBER: _ClassVar[int]
    CREATED_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    IS_DEFAULT_FIELD_NUMBER: _ClassVar[int]
    PROFILE_IDS_FIELD_NUMBER: _ClassVar[int]
    id: str
    created: str
    integration_id: str
    configuration: _struct_pb2.Struct
    is_default: bool
    profile_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, id: _Optional[str] = ..., created: _Optional[str] = ..., integration_id: _Optional[str] = ..., configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., is_default: bool = ..., profile_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class Integration(_message.Message):
    __slots__ = ("id", "created", "updated", "name", "plugin_id", "organization_id", "demo_integration_id", "configurations", "is_user_configured", "slug")
    ID_FIELD_NUMBER: _ClassVar[int]
    CREATED_FIELD_NUMBER: _ClassVar[int]
    UPDATED_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    PLUGIN_ID_FIELD_NUMBER: _ClassVar[int]
    ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
    DEMO_INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATIONS_FIELD_NUMBER: _ClassVar[int]
    IS_USER_CONFIGURED_FIELD_NUMBER: _ClassVar[int]
    SLUG_FIELD_NUMBER: _ClassVar[int]
    id: str
    created: str
    updated: str
    name: str
    plugin_id: str
    organization_id: str
    demo_integration_id: str
    configurations: _containers.RepeatedCompositeFieldContainer[Configuration]
    is_user_configured: bool
    slug: str
    def __init__(self, id: _Optional[str] = ..., created: _Optional[str] = ..., updated: _Optional[str] = ..., name: _Optional[str] = ..., plugin_id: _Optional[str] = ..., organization_id: _Optional[str] = ..., demo_integration_id: _Optional[str] = ..., configurations: _Optional[_Iterable[_Union[Configuration, _Mapping]]] = ..., is_user_configured: bool = ..., slug: _Optional[str] = ...) -> None: ...
