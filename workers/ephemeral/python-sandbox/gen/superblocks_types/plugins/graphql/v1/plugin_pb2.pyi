from common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Custom(_message.Message):
    __slots__ = ("variables", "requestFormat")
    VARIABLES_FIELD_NUMBER: _ClassVar[int]
    REQUESTFORMAT_FIELD_NUMBER: _ClassVar[int]
    variables: _plugin_pb2.Property
    requestFormat: _plugin_pb2.Property
    def __init__(self, variables: _Optional[_Union[_plugin_pb2.Property, _Mapping]] = ..., requestFormat: _Optional[_Union[_plugin_pb2.Property, _Mapping]] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("path", "headers", "body", "custom", "superblocksMetadata", "verboseHttpOutput", "failOnGraphqlErrors")
    PATH_FIELD_NUMBER: _ClassVar[int]
    HEADERS_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    CUSTOM_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    VERBOSEHTTPOUTPUT_FIELD_NUMBER: _ClassVar[int]
    FAILONGRAPHQLERRORS_FIELD_NUMBER: _ClassVar[int]
    path: str
    headers: _containers.RepeatedCompositeFieldContainer[_plugin_pb2.Property]
    body: str
    custom: Custom
    superblocksMetadata: _plugin_pb2.SuperblocksMetadata
    verboseHttpOutput: bool
    failOnGraphqlErrors: bool
    def __init__(self, path: _Optional[str] = ..., headers: _Optional[_Iterable[_Union[_plugin_pb2.Property, _Mapping]]] = ..., body: _Optional[str] = ..., custom: _Optional[_Union[Custom, _Mapping]] = ..., superblocksMetadata: _Optional[_Union[_plugin_pb2.SuperblocksMetadata, _Mapping]] = ..., verboseHttpOutput: bool = ..., failOnGraphqlErrors: bool = ...) -> None: ...
