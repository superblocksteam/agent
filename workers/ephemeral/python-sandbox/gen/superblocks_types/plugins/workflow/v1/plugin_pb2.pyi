from common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Tuple(_message.Message):
    __slots__ = ("key", "value")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: str
    def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("workflow", "custom", "queryParams", "superblocksMetadata")
    class CustomEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _plugin_pb2.Property
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_plugin_pb2.Property, _Mapping]] = ...) -> None: ...
    class QueryParamsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _plugin_pb2.Property
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_plugin_pb2.Property, _Mapping]] = ...) -> None: ...
    WORKFLOW_FIELD_NUMBER: _ClassVar[int]
    CUSTOM_FIELD_NUMBER: _ClassVar[int]
    QUERYPARAMS_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    workflow: str
    custom: _containers.MessageMap[str, _plugin_pb2.Property]
    queryParams: _containers.MessageMap[str, _plugin_pb2.Property]
    superblocksMetadata: _plugin_pb2.SuperblocksMetadata
    def __init__(self, workflow: _Optional[str] = ..., custom: _Optional[_Mapping[str, _plugin_pb2.Property]] = ..., queryParams: _Optional[_Mapping[str, _plugin_pb2.Property]] = ..., superblocksMetadata: _Optional[_Union[_plugin_pb2.SuperblocksMetadata, _Mapping]] = ...) -> None: ...
