from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class IntegrationMetadataEvent(_message.Message):
    __slots__ = ("upsert",)
    class Upsert(_message.Message):
        __slots__ = ("datasource_configuration", "integration_id", "configuration_id", "integration_type", "organization_id", "schema_version")
        DATASOURCE_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
        INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
        CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
        INTEGRATION_TYPE_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
        SCHEMA_VERSION_FIELD_NUMBER: _ClassVar[int]
        datasource_configuration: _struct_pb2.Struct
        integration_id: str
        configuration_id: str
        integration_type: str
        organization_id: str
        schema_version: str
        def __init__(self, datasource_configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., integration_id: _Optional[str] = ..., configuration_id: _Optional[str] = ..., integration_type: _Optional[str] = ..., organization_id: _Optional[str] = ..., schema_version: _Optional[str] = ...) -> None: ...
    UPSERT_FIELD_NUMBER: _ClassVar[int]
    upsert: IntegrationMetadataEvent.Upsert
    def __init__(self, upsert: _Optional[_Union[IntegrationMetadataEvent.Upsert, _Mapping]] = ...) -> None: ...
