from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("resource", "action", "pipeline", "projection", "query", "field", "sortby", "limit", "skip", "document", "replacement", "filter", "options", "update", "distinctKey", "superblocksMetadata")
    RESOURCE_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    PIPELINE_FIELD_NUMBER: _ClassVar[int]
    PROJECTION_FIELD_NUMBER: _ClassVar[int]
    QUERY_FIELD_NUMBER: _ClassVar[int]
    FIELD_FIELD_NUMBER: _ClassVar[int]
    SORTBY_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    SKIP_FIELD_NUMBER: _ClassVar[int]
    DOCUMENT_FIELD_NUMBER: _ClassVar[int]
    REPLACEMENT_FIELD_NUMBER: _ClassVar[int]
    FILTER_FIELD_NUMBER: _ClassVar[int]
    OPTIONS_FIELD_NUMBER: _ClassVar[int]
    UPDATE_FIELD_NUMBER: _ClassVar[int]
    DISTINCTKEY_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    resource: str
    action: str
    pipeline: str
    projection: str
    query: str
    field: str
    sortby: str
    limit: str
    skip: str
    document: str
    replacement: str
    filter: str
    options: str
    update: str
    distinctKey: str
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, resource: _Optional[str] = ..., action: _Optional[str] = ..., pipeline: _Optional[str] = ..., projection: _Optional[str] = ..., query: _Optional[str] = ..., field: _Optional[str] = ..., sortby: _Optional[str] = ..., limit: _Optional[str] = ..., skip: _Optional[str] = ..., document: _Optional[str] = ..., replacement: _Optional[str] = ..., filter: _Optional[str] = ..., options: _Optional[str] = ..., update: _Optional[str] = ..., distinctKey: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
