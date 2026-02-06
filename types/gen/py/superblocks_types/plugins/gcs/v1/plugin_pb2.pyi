from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Property(_message.Message):
    __slots__ = ("key", "value", "editable", "internal", "description", "mandatory", "type", "defaultValue", "minRange", "maxRange", "valueOptions")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    EDITABLE_FIELD_NUMBER: _ClassVar[int]
    INTERNAL_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    MANDATORY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    DEFAULTVALUE_FIELD_NUMBER: _ClassVar[int]
    MINRANGE_FIELD_NUMBER: _ClassVar[int]
    MAXRANGE_FIELD_NUMBER: _ClassVar[int]
    VALUEOPTIONS_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: int
    editable: bool
    internal: bool
    description: str
    mandatory: bool
    type: str
    defaultValue: str
    minRange: str
    maxRange: str
    valueOptions: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ..., editable: bool = ..., internal: bool = ..., description: _Optional[str] = ..., mandatory: bool = ..., type: _Optional[str] = ..., defaultValue: _Optional[str] = ..., minRange: _Optional[str] = ..., maxRange: _Optional[str] = ..., valueOptions: _Optional[_Iterable[str]] = ...) -> None: ...

class Custom(_message.Message):
    __slots__ = ("presignedExpiration",)
    PRESIGNEDEXPIRATION_FIELD_NUMBER: _ClassVar[int]
    presignedExpiration: Property
    def __init__(self, presignedExpiration: _Optional[_Union[Property, _Mapping]] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("resource", "resourceType", "action", "path", "prefix", "body", "fileObjects", "responseType", "custom", "superblocksMetadata")
    RESOURCE_FIELD_NUMBER: _ClassVar[int]
    RESOURCETYPE_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    PREFIX_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    FILEOBJECTS_FIELD_NUMBER: _ClassVar[int]
    RESPONSETYPE_FIELD_NUMBER: _ClassVar[int]
    CUSTOM_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    resource: str
    resourceType: str
    action: str
    path: str
    prefix: str
    body: str
    fileObjects: str
    responseType: str
    custom: Custom
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, resource: _Optional[str] = ..., resourceType: _Optional[str] = ..., action: _Optional[str] = ..., path: _Optional[str] = ..., prefix: _Optional[str] = ..., body: _Optional[str] = ..., fileObjects: _Optional[str] = ..., responseType: _Optional[str] = ..., custom: _Optional[_Union[Custom, _Mapping]] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
