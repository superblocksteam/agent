from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import common_pb2 as _common_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class RegistrationRequest(_message.Message):
    __slots__ = ("plugin_versions", "type", "tags", "signing_key_id", "verification_key_ids")
    class PluginVersionsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: VersionList
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[VersionList, _Mapping]] = ...) -> None: ...
    class TagsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: TagList
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[TagList, _Mapping]] = ...) -> None: ...
    PLUGIN_VERSIONS_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    TAGS_FIELD_NUMBER: _ClassVar[int]
    SIGNING_KEY_ID_FIELD_NUMBER: _ClassVar[int]
    VERIFICATION_KEY_IDS_FIELD_NUMBER: _ClassVar[int]
    plugin_versions: _containers.MessageMap[str, VersionList]
    type: int
    tags: _containers.MessageMap[str, TagList]
    signing_key_id: str
    verification_key_ids: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, plugin_versions: _Optional[_Mapping[str, VersionList]] = ..., type: _Optional[int] = ..., tags: _Optional[_Mapping[str, TagList]] = ..., signing_key_id: _Optional[str] = ..., verification_key_ids: _Optional[_Iterable[str]] = ...) -> None: ...

class RegistrationResponse(_message.Message):
    __slots__ = ("response_meta", "data")
    class ResponseMeta(_message.Message):
        __slots__ = ("status", "message", "success")
        STATUS_FIELD_NUMBER: _ClassVar[int]
        MESSAGE_FIELD_NUMBER: _ClassVar[int]
        SUCCESS_FIELD_NUMBER: _ClassVar[int]
        status: int
        message: str
        success: bool
        def __init__(self, status: _Optional[int] = ..., message: _Optional[str] = ..., success: bool = ...) -> None: ...
    class ResponseBody(_message.Message):
        __slots__ = ("agent", "billing_plan", "organization_id", "organization_name")
        class Agent(_message.Message):
            __slots__ = ("id", "key", "environment", "status", "version", "version_external", "supported_plugin_versions", "url", "type", "updated", "created", "tags")
            class SupportedPluginVersionsEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: VersionList
                def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[VersionList, _Mapping]] = ...) -> None: ...
            class TagsEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: TagList
                def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[TagList, _Mapping]] = ...) -> None: ...
            ID_FIELD_NUMBER: _ClassVar[int]
            KEY_FIELD_NUMBER: _ClassVar[int]
            ENVIRONMENT_FIELD_NUMBER: _ClassVar[int]
            STATUS_FIELD_NUMBER: _ClassVar[int]
            VERSION_FIELD_NUMBER: _ClassVar[int]
            VERSION_EXTERNAL_FIELD_NUMBER: _ClassVar[int]
            SUPPORTED_PLUGIN_VERSIONS_FIELD_NUMBER: _ClassVar[int]
            URL_FIELD_NUMBER: _ClassVar[int]
            TYPE_FIELD_NUMBER: _ClassVar[int]
            UPDATED_FIELD_NUMBER: _ClassVar[int]
            CREATED_FIELD_NUMBER: _ClassVar[int]
            TAGS_FIELD_NUMBER: _ClassVar[int]
            id: str
            key: str
            environment: str
            status: str
            version: str
            version_external: str
            supported_plugin_versions: _containers.MessageMap[str, VersionList]
            url: str
            type: int
            updated: _timestamp_pb2.Timestamp
            created: _timestamp_pb2.Timestamp
            tags: _containers.MessageMap[str, TagList]
            def __init__(self, id: _Optional[str] = ..., key: _Optional[str] = ..., environment: _Optional[str] = ..., status: _Optional[str] = ..., version: _Optional[str] = ..., version_external: _Optional[str] = ..., supported_plugin_versions: _Optional[_Mapping[str, VersionList]] = ..., url: _Optional[str] = ..., type: _Optional[int] = ..., updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., created: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., tags: _Optional[_Mapping[str, TagList]] = ...) -> None: ...
        AGENT_FIELD_NUMBER: _ClassVar[int]
        BILLING_PLAN_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_NAME_FIELD_NUMBER: _ClassVar[int]
        agent: RegistrationResponse.ResponseBody.Agent
        billing_plan: str
        organization_id: str
        organization_name: str
        def __init__(self, agent: _Optional[_Union[RegistrationResponse.ResponseBody.Agent, _Mapping]] = ..., billing_plan: _Optional[str] = ..., organization_id: _Optional[str] = ..., organization_name: _Optional[str] = ...) -> None: ...
    RESPONSE_META_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    response_meta: RegistrationResponse.ResponseMeta
    data: RegistrationResponse.ResponseBody
    def __init__(self, response_meta: _Optional[_Union[RegistrationResponse.ResponseMeta, _Mapping]] = ..., data: _Optional[_Union[RegistrationResponse.ResponseBody, _Mapping]] = ...) -> None: ...

class VersionList(_message.Message):
    __slots__ = ("versions",)
    VERSIONS_FIELD_NUMBER: _ClassVar[int]
    versions: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, versions: _Optional[_Iterable[str]] = ...) -> None: ...

class TagList(_message.Message):
    __slots__ = ("tags",)
    TAGS_FIELD_NUMBER: _ClassVar[int]
    tags: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, tags: _Optional[_Iterable[str]] = ...) -> None: ...

class AuditLogRequest(_message.Message):
    __slots__ = ("audit_logs",)
    class AuditLog(_message.Message):
        __slots__ = ("id", "entity_id", "entity_type", "organization_id", "is_deployed", "source", "target", "type", "agent_id", "status", "error", "api_location_context", "api_timing", "user_type", "targetName")
        class ApiRunStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            API_RUN_STATUS_UNSPECIFIED: _ClassVar[AuditLogRequest.AuditLog.ApiRunStatus]
            API_RUN_STATUS_SUCCESS: _ClassVar[AuditLogRequest.AuditLog.ApiRunStatus]
            API_RUN_STATUS_FAILED: _ClassVar[AuditLogRequest.AuditLog.ApiRunStatus]
        API_RUN_STATUS_UNSPECIFIED: AuditLogRequest.AuditLog.ApiRunStatus
        API_RUN_STATUS_SUCCESS: AuditLogRequest.AuditLog.ApiRunStatus
        API_RUN_STATUS_FAILED: AuditLogRequest.AuditLog.ApiRunStatus
        class AuditLogEntityType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            AUDIT_LOG_ENTITY_TYPE_UNSPECIFIED: _ClassVar[AuditLogRequest.AuditLog.AuditLogEntityType]
            AUDIT_LOG_ENTITY_TYPE_APPLICATION: _ClassVar[AuditLogRequest.AuditLog.AuditLogEntityType]
            AUDIT_LOG_ENTITY_TYPE_WORKFLOW: _ClassVar[AuditLogRequest.AuditLog.AuditLogEntityType]
            AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB: _ClassVar[AuditLogRequest.AuditLog.AuditLogEntityType]
            AUDIT_LOG_ENTITY_TYPE_STEP: _ClassVar[AuditLogRequest.AuditLog.AuditLogEntityType]
        AUDIT_LOG_ENTITY_TYPE_UNSPECIFIED: AuditLogRequest.AuditLog.AuditLogEntityType
        AUDIT_LOG_ENTITY_TYPE_APPLICATION: AuditLogRequest.AuditLog.AuditLogEntityType
        AUDIT_LOG_ENTITY_TYPE_WORKFLOW: AuditLogRequest.AuditLog.AuditLogEntityType
        AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB: AuditLogRequest.AuditLog.AuditLogEntityType
        AUDIT_LOG_ENTITY_TYPE_STEP: AuditLogRequest.AuditLog.AuditLogEntityType
        class AuditLogEventType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            AUDIT_LOG_EVENT_TYPE_UNSPECIFIED: _ClassVar[AuditLogRequest.AuditLog.AuditLogEventType]
            AUDIT_LOG_EVENT_TYPE_API_RUN: _ClassVar[AuditLogRequest.AuditLog.AuditLogEventType]
        AUDIT_LOG_EVENT_TYPE_UNSPECIFIED: AuditLogRequest.AuditLog.AuditLogEventType
        AUDIT_LOG_EVENT_TYPE_API_RUN: AuditLogRequest.AuditLog.AuditLogEventType
        class ApiLocationContext(_message.Message):
            __slots__ = ("application_id",)
            APPLICATION_ID_FIELD_NUMBER: _ClassVar[int]
            application_id: str
            def __init__(self, application_id: _Optional[str] = ...) -> None: ...
        class ApiTiming(_message.Message):
            __slots__ = ("start", "end")
            START_FIELD_NUMBER: _ClassVar[int]
            END_FIELD_NUMBER: _ClassVar[int]
            start: int
            end: int
            def __init__(self, start: _Optional[int] = ..., end: _Optional[int] = ...) -> None: ...
        ID_FIELD_NUMBER: _ClassVar[int]
        ENTITY_ID_FIELD_NUMBER: _ClassVar[int]
        ENTITY_TYPE_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_ID_FIELD_NUMBER: _ClassVar[int]
        IS_DEPLOYED_FIELD_NUMBER: _ClassVar[int]
        SOURCE_FIELD_NUMBER: _ClassVar[int]
        TARGET_FIELD_NUMBER: _ClassVar[int]
        TYPE_FIELD_NUMBER: _ClassVar[int]
        AGENT_ID_FIELD_NUMBER: _ClassVar[int]
        STATUS_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        API_LOCATION_CONTEXT_FIELD_NUMBER: _ClassVar[int]
        API_TIMING_FIELD_NUMBER: _ClassVar[int]
        USER_TYPE_FIELD_NUMBER: _ClassVar[int]
        TARGETNAME_FIELD_NUMBER: _ClassVar[int]
        id: str
        entity_id: str
        entity_type: AuditLogRequest.AuditLog.AuditLogEntityType
        organization_id: str
        is_deployed: bool
        source: str
        target: str
        type: AuditLogRequest.AuditLog.AuditLogEventType
        agent_id: str
        status: AuditLogRequest.AuditLog.ApiRunStatus
        error: str
        api_location_context: AuditLogRequest.AuditLog.ApiLocationContext
        api_timing: AuditLogRequest.AuditLog.ApiTiming
        user_type: _common_pb2.UserType
        targetName: str
        def __init__(self, id: _Optional[str] = ..., entity_id: _Optional[str] = ..., entity_type: _Optional[_Union[AuditLogRequest.AuditLog.AuditLogEntityType, str]] = ..., organization_id: _Optional[str] = ..., is_deployed: bool = ..., source: _Optional[str] = ..., target: _Optional[str] = ..., type: _Optional[_Union[AuditLogRequest.AuditLog.AuditLogEventType, str]] = ..., agent_id: _Optional[str] = ..., status: _Optional[_Union[AuditLogRequest.AuditLog.ApiRunStatus, str]] = ..., error: _Optional[str] = ..., api_location_context: _Optional[_Union[AuditLogRequest.AuditLog.ApiLocationContext, _Mapping]] = ..., api_timing: _Optional[_Union[AuditLogRequest.AuditLog.ApiTiming, _Mapping]] = ..., user_type: _Optional[_Union[_common_pb2.UserType, str]] = ..., targetName: _Optional[str] = ...) -> None: ...
    AUDIT_LOGS_FIELD_NUMBER: _ClassVar[int]
    audit_logs: _containers.RepeatedCompositeFieldContainer[AuditLogRequest.AuditLog]
    def __init__(self, audit_logs: _Optional[_Iterable[_Union[AuditLogRequest.AuditLog, _Mapping]]] = ...) -> None: ...
