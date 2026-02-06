from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class PresignedMethod(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    PRESIGNED_METHOD_UNSPECIFIED: _ClassVar[PresignedMethod]
    PRESIGNED_METHOD_GET: _ClassVar[PresignedMethod]
    PRESIGNED_METHOD_PUT: _ClassVar[PresignedMethod]
PRESIGNED_METHOD_UNSPECIFIED: PresignedMethod
PRESIGNED_METHOD_GET: PresignedMethod
PRESIGNED_METHOD_PUT: PresignedMethod

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
    __slots__ = ("presignedExpiration", "presignedMethod")
    PRESIGNEDEXPIRATION_FIELD_NUMBER: _ClassVar[int]
    PRESIGNEDMETHOD_FIELD_NUMBER: _ClassVar[int]
    presignedExpiration: Property
    presignedMethod: PresignedMethod
    def __init__(self, presignedExpiration: _Optional[_Union[Property, _Mapping]] = ..., presignedMethod: _Optional[_Union[PresignedMethod, str]] = ...) -> None: ...

class ListFilesConfig(_message.Message):
    __slots__ = ("prefix", "delimiter")
    PREFIX_FIELD_NUMBER: _ClassVar[int]
    DELIMITER_FIELD_NUMBER: _ClassVar[int]
    prefix: str
    delimiter: str
    def __init__(self, prefix: _Optional[str] = ..., delimiter: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("resource", "action", "path", "body", "fileObjects", "responseType", "custom", "superblocksMetadata", "list_files_config")
    RESOURCE_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    FILEOBJECTS_FIELD_NUMBER: _ClassVar[int]
    RESPONSETYPE_FIELD_NUMBER: _ClassVar[int]
    CUSTOM_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    LIST_FILES_CONFIG_FIELD_NUMBER: _ClassVar[int]
    resource: str
    action: str
    path: str
    body: str
    fileObjects: str
    responseType: str
    custom: Custom
    superblocksMetadata: SuperblocksMetadata
    list_files_config: ListFilesConfig
    def __init__(self, resource: _Optional[str] = ..., action: _Optional[str] = ..., path: _Optional[str] = ..., body: _Optional[str] = ..., fileObjects: _Optional[str] = ..., responseType: _Optional[str] = ..., custom: _Optional[_Union[Custom, _Mapping]] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ..., list_files_config: _Optional[_Union[ListFilesConfig, _Mapping]] = ...) -> None: ...
