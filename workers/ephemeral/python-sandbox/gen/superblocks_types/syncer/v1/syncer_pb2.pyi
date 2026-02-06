from ai.v1 import metadata_pb2 as _metadata_pb2
from buf.validate import validate_pb2 as _validate_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Metadata(_message.Message):
    __slots__ = ("configuration_id", "integration_id", "raw_metadata", "updated_datetime_utc", "integration_type", "organization_id")
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    RAW_METADATA_FIELD_NUMBER: _ClassVar[int]
    UPDATED_DATETIME_UTC_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
    configuration_id: str
    integration_id: str
    raw_metadata: _metadata_pb2.Metadata
    updated_datetime_utc: _timestamp_pb2.Timestamp
    integration_type: str
    organization_id: str
    def __init__(self, configuration_id: _Optional[str] = ..., integration_id: _Optional[str] = ..., raw_metadata: _Optional[_Union[_metadata_pb2.Metadata, _Mapping]] = ..., updated_datetime_utc: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., integration_type: _Optional[str] = ..., organization_id: _Optional[str] = ...) -> None: ...
