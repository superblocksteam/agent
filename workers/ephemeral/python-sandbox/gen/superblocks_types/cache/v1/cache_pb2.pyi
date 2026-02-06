from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Operation(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    OPERATION_UNSPECIFIED: _ClassVar[Operation]
    OPERATION_UPSERT: _ClassVar[Operation]
    OPERATION_DELETE: _ClassVar[Operation]
OPERATION_UNSPECIFIED: Operation
OPERATION_UPSERT: Operation
OPERATION_DELETE: Operation

class Mutation(_message.Message):
    __slots__ = ("resource", "id", "data", "organization_id", "tombstone", "rbac_role")
    RESOURCE_FIELD_NUMBER: _ClassVar[int]
    ID_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
    TOMBSTONE_FIELD_NUMBER: _ClassVar[int]
    RBAC_ROLE_FIELD_NUMBER: _ClassVar[int]
    resource: str
    id: str
    data: _struct_pb2.Value
    organization_id: str
    tombstone: bool
    rbac_role: str
    def __init__(self, resource: _Optional[str] = ..., id: _Optional[str] = ..., data: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., organization_id: _Optional[str] = ..., tombstone: bool = ..., rbac_role: _Optional[str] = ...) -> None: ...

class MutationBatch(_message.Message):
    __slots__ = ("operation", "batch")
    OPERATION_FIELD_NUMBER: _ClassVar[int]
    BATCH_FIELD_NUMBER: _ClassVar[int]
    operation: Operation
    batch: _containers.RepeatedCompositeFieldContainer[Mutation]
    def __init__(self, operation: _Optional[_Union[Operation, str]] = ..., batch: _Optional[_Iterable[_Union[Mutation, _Mapping]]] = ...) -> None: ...
