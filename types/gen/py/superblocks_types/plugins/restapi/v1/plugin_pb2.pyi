from common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("httpMethod", "responseType", "headers", "params", "bodyType", "body", "formData", "fileFormKey", "fileName", "path", "jsonBody", "superblocksMetadata", "verboseHttpOutput", "doNotFailOnRequestError")
    HTTPMETHOD_FIELD_NUMBER: _ClassVar[int]
    RESPONSETYPE_FIELD_NUMBER: _ClassVar[int]
    HEADERS_FIELD_NUMBER: _ClassVar[int]
    PARAMS_FIELD_NUMBER: _ClassVar[int]
    BODYTYPE_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    FORMDATA_FIELD_NUMBER: _ClassVar[int]
    FILEFORMKEY_FIELD_NUMBER: _ClassVar[int]
    FILENAME_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    JSONBODY_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    VERBOSEHTTPOUTPUT_FIELD_NUMBER: _ClassVar[int]
    DONOTFAILONREQUESTERROR_FIELD_NUMBER: _ClassVar[int]
    httpMethod: str
    responseType: str
    headers: _containers.RepeatedCompositeFieldContainer[_plugin_pb2.Property]
    params: _containers.RepeatedCompositeFieldContainer[_plugin_pb2.Property]
    bodyType: str
    body: str
    formData: _containers.RepeatedCompositeFieldContainer[_plugin_pb2.Property]
    fileFormKey: str
    fileName: str
    path: str
    jsonBody: str
    superblocksMetadata: _plugin_pb2.SuperblocksMetadata
    verboseHttpOutput: bool
    doNotFailOnRequestError: bool
    def __init__(self, httpMethod: _Optional[str] = ..., responseType: _Optional[str] = ..., headers: _Optional[_Iterable[_Union[_plugin_pb2.Property, _Mapping]]] = ..., params: _Optional[_Iterable[_Union[_plugin_pb2.Property, _Mapping]]] = ..., bodyType: _Optional[str] = ..., body: _Optional[str] = ..., formData: _Optional[_Iterable[_Union[_plugin_pb2.Property, _Mapping]]] = ..., fileFormKey: _Optional[str] = ..., fileName: _Optional[str] = ..., path: _Optional[str] = ..., jsonBody: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[_plugin_pb2.SuperblocksMetadata, _Mapping]] = ..., verboseHttpOutput: bool = ..., doNotFailOnRequestError: bool = ...) -> None: ...
