from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import errors_pb2 as _errors_pb2
from event.v1 import service_pb2 as _service_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from syncer.v1 import syncer_pb2 as _syncer_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class GetConfigurationMetadataRequest(_message.Message):
    __slots__ = ("integration_id",)
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    def __init__(self, integration_id: _Optional[str] = ...) -> None: ...

class GetConfigurationMetadataResponse(_message.Message):
    __slots__ = ("integration_id", "configurations", "integration_type", "organization_id", "errors")
    class ConfigurationsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Struct
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATIONS_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    configurations: _containers.MessageMap[str, _struct_pb2.Struct]
    integration_type: str
    organization_id: str
    errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
    def __init__(self, integration_id: _Optional[str] = ..., configurations: _Optional[_Mapping[str, _struct_pb2.Struct]] = ..., integration_type: _Optional[str] = ..., organization_id: _Optional[str] = ..., errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ...) -> None: ...

class SyncRequest(_message.Message):
    __slots__ = ("integration_ids",)
    INTEGRATION_IDS_FIELD_NUMBER: _ClassVar[int]
    integration_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, integration_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class SyncResponse(_message.Message):
    __slots__ = ("integrations_synced", "errors")
    class Integration(_message.Message):
        __slots__ = ("configurationIds",)
        CONFIGURATIONIDS_FIELD_NUMBER: _ClassVar[int]
        configurationIds: _containers.RepeatedScalarFieldContainer[str]
        def __init__(self, configurationIds: _Optional[_Iterable[str]] = ...) -> None: ...
    class IntegrationsSyncedEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: SyncResponse.Integration
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[SyncResponse.Integration, _Mapping]] = ...) -> None: ...
    INTEGRATIONS_SYNCED_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    integrations_synced: _containers.MessageMap[str, SyncResponse.Integration]
    errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
    def __init__(self, integrations_synced: _Optional[_Mapping[str, SyncResponse.Integration]] = ..., errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ...) -> None: ...

class UpsertMetadataRequest(_message.Message):
    __slots__ = ("metadata",)
    METADATA_FIELD_NUMBER: _ClassVar[int]
    metadata: _containers.RepeatedCompositeFieldContainer[_syncer_pb2.Metadata]
    def __init__(self, metadata: _Optional[_Iterable[_Union[_syncer_pb2.Metadata, _Mapping]]] = ...) -> None: ...

class UpsertMetadataResponse(_message.Message):
    __slots__ = ("errors",)
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
    def __init__(self, errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ...) -> None: ...

class DeleteMetadataRequest(_message.Message):
    __slots__ = ("integration_id", "configuration_ids")
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_IDS_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    configuration_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, integration_id: _Optional[str] = ..., configuration_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class DeleteMetadataResponse(_message.Message):
    __slots__ = ("errors",)
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
    def __init__(self, errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ...) -> None: ...
