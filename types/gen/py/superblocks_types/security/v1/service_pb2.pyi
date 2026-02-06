from buf.validate import validate_pb2 as _validate_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from utils.v1 import utils_pb2 as _utils_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Resource(_message.Message):
    __slots__ = ("api", "literal", "api_literal", "commit_id", "branch_name", "last_updated")
    class Literal(_message.Message):
        __slots__ = ("data", "signature", "resource_id", "organization_id", "last_updated", "type", "page_version")
        DATA_FIELD_NUMBER: _ClassVar[int]
        SIGNATURE_FIELD_NUMBER: _ClassVar[int]
        RESOURCE_ID_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
        LAST_UPDATED_FIELD_NUMBER: _ClassVar[int]
        TYPE_FIELD_NUMBER: _ClassVar[int]
        PAGE_VERSION_FIELD_NUMBER: _ClassVar[int]
        data: _struct_pb2.Value
        signature: _utils_pb2.Signature
        resource_id: str
        organization_id: str
        last_updated: _timestamp_pb2.Timestamp
        type: str
        page_version: int
        def __init__(self, data: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., signature: _Optional[_Union[_utils_pb2.Signature, _Mapping]] = ..., resource_id: _Optional[str] = ..., organization_id: _Optional[str] = ..., last_updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., type: _Optional[str] = ..., page_version: _Optional[int] = ...) -> None: ...
    class ApiLiteral(_message.Message):
        __slots__ = ("data",)
        DATA_FIELD_NUMBER: _ClassVar[int]
        data: _struct_pb2.Value
        def __init__(self, data: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    API_FIELD_NUMBER: _ClassVar[int]
    LITERAL_FIELD_NUMBER: _ClassVar[int]
    API_LITERAL_FIELD_NUMBER: _ClassVar[int]
    COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
    BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
    LAST_UPDATED_FIELD_NUMBER: _ClassVar[int]
    api: _struct_pb2.Value
    literal: Resource.Literal
    api_literal: Resource.ApiLiteral
    commit_id: str
    branch_name: str
    last_updated: _timestamp_pb2.Timestamp
    def __init__(self, api: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., literal: _Optional[_Union[Resource.Literal, _Mapping]] = ..., api_literal: _Optional[_Union[Resource.ApiLiteral, _Mapping]] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., last_updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class SignRequest(_message.Message):
    __slots__ = ("resource",)
    RESOURCE_FIELD_NUMBER: _ClassVar[int]
    resource: Resource
    def __init__(self, resource: _Optional[_Union[Resource, _Mapping]] = ...) -> None: ...

class SignResponse(_message.Message):
    __slots__ = ("signature",)
    SIGNATURE_FIELD_NUMBER: _ClassVar[int]
    signature: _utils_pb2.Signature
    def __init__(self, signature: _Optional[_Union[_utils_pb2.Signature, _Mapping]] = ...) -> None: ...

class VerifyRequest(_message.Message):
    __slots__ = ("resources",)
    RESOURCES_FIELD_NUMBER: _ClassVar[int]
    resources: _containers.RepeatedCompositeFieldContainer[Resource]
    def __init__(self, resources: _Optional[_Iterable[_Union[Resource, _Mapping]]] = ...) -> None: ...

class VerifyResponse(_message.Message):
    __slots__ = ("key_id",)
    KEY_ID_FIELD_NUMBER: _ClassVar[int]
    key_id: str
    def __init__(self, key_id: _Optional[str] = ...) -> None: ...
