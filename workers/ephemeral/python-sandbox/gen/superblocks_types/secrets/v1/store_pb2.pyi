from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import common_pb2 as _common_pb2
from common.v1 import errors_pb2 as _errors_pb2
from google.api import annotations_pb2 as _annotations_pb2
from secrets.v1 import secrets_pb2 as _secrets_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class InvalidateRequest(_message.Message):
    __slots__ = ("store", "secret", "configuration_id")
    STORE_FIELD_NUMBER: _ClassVar[int]
    SECRET_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    store: str
    secret: str
    configuration_id: str
    def __init__(self, store: _Optional[str] = ..., secret: _Optional[str] = ..., configuration_id: _Optional[str] = ...) -> None: ...

class InvalidateResponse(_message.Message):
    __slots__ = ("errors", "invalidations", "message")
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    INVALIDATIONS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
    invalidations: _containers.RepeatedCompositeFieldContainer[_secrets_pb2.Invalidation]
    message: str
    def __init__(self, errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ..., invalidations: _Optional[_Iterable[_Union[_secrets_pb2.Invalidation, _Mapping]]] = ..., message: _Optional[str] = ...) -> None: ...

class ListSecretsRequest(_message.Message):
    __slots__ = ("store", "profile", "provider")
    STORE_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    PROVIDER_FIELD_NUMBER: _ClassVar[int]
    store: str
    profile: _common_pb2.Profile
    provider: _secrets_pb2.Provider
    def __init__(self, store: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., provider: _Optional[_Union[_secrets_pb2.Provider, _Mapping]] = ...) -> None: ...

class ListSecretsResponse(_message.Message):
    __slots__ = ("secrets",)
    SECRETS_FIELD_NUMBER: _ClassVar[int]
    secrets: _containers.RepeatedCompositeFieldContainer[_secrets_pb2.Details]
    def __init__(self, secrets: _Optional[_Iterable[_Union[_secrets_pb2.Details, _Mapping]]] = ...) -> None: ...
