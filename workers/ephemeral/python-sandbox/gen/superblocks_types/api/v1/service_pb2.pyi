from api.v1 import api_pb2 as _api_pb2
from api.v1 import event_pb2 as _event_pb2
from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import common_pb2 as _common_pb2
from common.v1 import errors_pb2 as _errors_pb2
from common.v1 import health_pb2 as _health_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from plugins.adls.v1 import plugin_pb2 as _plugin_pb2
from plugins.cosmosdb.v1 import plugin_pb2 as _plugin_pb2_1
from plugins.couchbase.v1 import plugin_pb2 as _plugin_pb2_1_1
from plugins.dynamodb.v1 import plugin_pb2 as _plugin_pb2_1_1_1
from plugins.kafka.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1
from plugins.kinesis.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1
from plugins.salesforce.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from store.v1 import store_pb2 as _store_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ViewMode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    VIEW_MODE_UNSPECIFIED: _ClassVar[ViewMode]
    VIEW_MODE_EDIT: _ClassVar[ViewMode]
    VIEW_MODE_PREVIEW: _ClassVar[ViewMode]
    VIEW_MODE_DEPLOYED: _ClassVar[ViewMode]
VIEW_MODE_UNSPECIFIED: ViewMode
VIEW_MODE_EDIT: ViewMode
VIEW_MODE_PREVIEW: ViewMode
VIEW_MODE_DEPLOYED: ViewMode

class HealthRequest(_message.Message):
    __slots__ = ("detailed",)
    DETAILED_FIELD_NUMBER: _ClassVar[int]
    detailed: bool
    def __init__(self, detailed: bool = ...) -> None: ...

class ValidateRequest(_message.Message):
    __slots__ = ("api",)
    API_FIELD_NUMBER: _ClassVar[int]
    api: _api_pb2.Api
    def __init__(self, api: _Optional[_Union[_api_pb2.Api, _Mapping]] = ...) -> None: ...

class ExecuteRequest(_message.Message):
    __slots__ = ("options", "inputs", "definition", "fetch", "fetch_by_path", "fetch_code", "files", "profile", "mocks", "view_mode")
    class Options(_message.Message):
        __slots__ = ("exclude_output", "include_event_outputs", "include_events", "start", "stop", "include_resolved", "include_api_events")
        EXCLUDE_OUTPUT_FIELD_NUMBER: _ClassVar[int]
        INCLUDE_EVENT_OUTPUTS_FIELD_NUMBER: _ClassVar[int]
        INCLUDE_EVENTS_FIELD_NUMBER: _ClassVar[int]
        START_FIELD_NUMBER: _ClassVar[int]
        STOP_FIELD_NUMBER: _ClassVar[int]
        INCLUDE_RESOLVED_FIELD_NUMBER: _ClassVar[int]
        ASYNC_FIELD_NUMBER: _ClassVar[int]
        INCLUDE_API_EVENTS_FIELD_NUMBER: _ClassVar[int]
        exclude_output: bool
        include_event_outputs: bool
        include_events: bool
        start: str
        stop: str
        include_resolved: bool
        include_api_events: bool
        def __init__(self, exclude_output: bool = ..., include_event_outputs: bool = ..., include_events: bool = ..., start: _Optional[str] = ..., stop: _Optional[str] = ..., include_resolved: bool = ..., include_api_events: bool = ..., **kwargs) -> None: ...
    class Fetch(_message.Message):
        __slots__ = ("id", "profile", "test", "token", "view_mode", "commit_id", "branch_name")
        ID_FIELD_NUMBER: _ClassVar[int]
        PROFILE_FIELD_NUMBER: _ClassVar[int]
        TEST_FIELD_NUMBER: _ClassVar[int]
        TOKEN_FIELD_NUMBER: _ClassVar[int]
        VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
        COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
        BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
        id: str
        profile: _common_pb2.Profile
        test: bool
        token: str
        view_mode: ViewMode
        commit_id: str
        branch_name: str
        def __init__(self, id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., test: bool = ..., token: _Optional[str] = ..., view_mode: _Optional[_Union[ViewMode, str]] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ...) -> None: ...
    class FetchByPath(_message.Message):
        __slots__ = ("profile", "test", "view_mode", "path", "application_id", "commit_id", "branch_name")
        PROFILE_FIELD_NUMBER: _ClassVar[int]
        TEST_FIELD_NUMBER: _ClassVar[int]
        VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        APPLICATION_ID_FIELD_NUMBER: _ClassVar[int]
        COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
        BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
        profile: _common_pb2.Profile
        test: bool
        view_mode: ViewMode
        path: str
        application_id: str
        commit_id: str
        branch_name: str
        def __init__(self, profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., test: bool = ..., view_mode: _Optional[_Union[ViewMode, str]] = ..., path: _Optional[str] = ..., application_id: _Optional[str] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ...) -> None: ...
    class FetchCode(_message.Message):
        __slots__ = ("id", "profile", "view_mode", "commit_id", "branch_name", "entry_point")
        ID_FIELD_NUMBER: _ClassVar[int]
        PROFILE_FIELD_NUMBER: _ClassVar[int]
        VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
        COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
        BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
        ENTRY_POINT_FIELD_NUMBER: _ClassVar[int]
        id: str
        profile: _common_pb2.Profile
        view_mode: ViewMode
        commit_id: str
        branch_name: str
        entry_point: str
        def __init__(self, id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., view_mode: _Optional[_Union[ViewMode, str]] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., entry_point: _Optional[str] = ...) -> None: ...
    class InputsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class File(_message.Message):
        __slots__ = ("originalName", "buffer", "encoding", "mimeType", "size")
        ORIGINALNAME_FIELD_NUMBER: _ClassVar[int]
        BUFFER_FIELD_NUMBER: _ClassVar[int]
        ENCODING_FIELD_NUMBER: _ClassVar[int]
        MIMETYPE_FIELD_NUMBER: _ClassVar[int]
        SIZE_FIELD_NUMBER: _ClassVar[int]
        originalName: str
        buffer: bytes
        encoding: str
        mimeType: str
        size: str
        def __init__(self, originalName: _Optional[str] = ..., buffer: _Optional[bytes] = ..., encoding: _Optional[str] = ..., mimeType: _Optional[str] = ..., size: _Optional[str] = ...) -> None: ...
    OPTIONS_FIELD_NUMBER: _ClassVar[int]
    INPUTS_FIELD_NUMBER: _ClassVar[int]
    DEFINITION_FIELD_NUMBER: _ClassVar[int]
    FETCH_FIELD_NUMBER: _ClassVar[int]
    FETCH_BY_PATH_FIELD_NUMBER: _ClassVar[int]
    FETCH_CODE_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    MOCKS_FIELD_NUMBER: _ClassVar[int]
    VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
    options: ExecuteRequest.Options
    inputs: _containers.MessageMap[str, _struct_pb2.Value]
    definition: Definition
    fetch: ExecuteRequest.Fetch
    fetch_by_path: ExecuteRequest.FetchByPath
    fetch_code: ExecuteRequest.FetchCode
    files: _containers.RepeatedCompositeFieldContainer[ExecuteRequest.File]
    profile: _common_pb2.Profile
    mocks: _containers.RepeatedCompositeFieldContainer[Mock]
    view_mode: ViewMode
    def __init__(self, options: _Optional[_Union[ExecuteRequest.Options, _Mapping]] = ..., inputs: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., definition: _Optional[_Union[Definition, _Mapping]] = ..., fetch: _Optional[_Union[ExecuteRequest.Fetch, _Mapping]] = ..., fetch_by_path: _Optional[_Union[ExecuteRequest.FetchByPath, _Mapping]] = ..., fetch_code: _Optional[_Union[ExecuteRequest.FetchCode, _Mapping]] = ..., files: _Optional[_Iterable[_Union[ExecuteRequest.File, _Mapping]]] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., mocks: _Optional[_Iterable[_Union[Mock, _Mapping]]] = ..., view_mode: _Optional[_Union[ViewMode, str]] = ...) -> None: ...

class ExecuteV3Request(_message.Message):
    __slots__ = ("application_id", "inputs", "view_mode", "profile", "commit_id", "branch_name", "entry_point", "files")
    class InputsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Value
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    APPLICATION_ID_FIELD_NUMBER: _ClassVar[int]
    INPUTS_FIELD_NUMBER: _ClassVar[int]
    VIEW_MODE_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
    BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
    ENTRY_POINT_FIELD_NUMBER: _ClassVar[int]
    FILES_FIELD_NUMBER: _ClassVar[int]
    application_id: str
    inputs: _containers.MessageMap[str, _struct_pb2.Value]
    view_mode: ViewMode
    profile: _common_pb2.Profile
    commit_id: str
    branch_name: str
    entry_point: str
    files: _containers.RepeatedCompositeFieldContainer[ExecuteRequest.File]
    def __init__(self, application_id: _Optional[str] = ..., inputs: _Optional[_Mapping[str, _struct_pb2.Value]] = ..., view_mode: _Optional[_Union[ViewMode, str]] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., entry_point: _Optional[str] = ..., files: _Optional[_Iterable[_Union[ExecuteRequest.File, _Mapping]]] = ...) -> None: ...

class Definition(_message.Message):
    __slots__ = ("api", "integrations", "metadata", "stores")
    class Metadata(_message.Message):
        __slots__ = ("requester", "profile", "organization_plan", "organization_name", "requester_type")
        REQUESTER_FIELD_NUMBER: _ClassVar[int]
        PROFILE_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_PLAN_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_NAME_FIELD_NUMBER: _ClassVar[int]
        REQUESTER_TYPE_FIELD_NUMBER: _ClassVar[int]
        requester: str
        profile: str
        organization_plan: str
        organization_name: str
        requester_type: _common_pb2.UserType
        def __init__(self, requester: _Optional[str] = ..., profile: _Optional[str] = ..., organization_plan: _Optional[str] = ..., organization_name: _Optional[str] = ..., requester_type: _Optional[_Union[_common_pb2.UserType, str]] = ...) -> None: ...
    class IntegrationsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _struct_pb2.Struct
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...
    API_FIELD_NUMBER: _ClassVar[int]
    INTEGRATIONS_FIELD_NUMBER: _ClassVar[int]
    METADATA_FIELD_NUMBER: _ClassVar[int]
    STORES_FIELD_NUMBER: _ClassVar[int]
    api: _api_pb2.Api
    integrations: _containers.MessageMap[str, _struct_pb2.Struct]
    metadata: Definition.Metadata
    stores: _store_pb2.Stores
    def __init__(self, api: _Optional[_Union[_api_pb2.Api, _Mapping]] = ..., integrations: _Optional[_Mapping[str, _struct_pb2.Struct]] = ..., metadata: _Optional[_Union[Definition.Metadata, _Mapping]] = ..., stores: _Optional[_Union[_store_pb2.Stores, _Mapping]] = ...) -> None: ...

class StatusRequest(_message.Message):
    __slots__ = ("execution",)
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    execution: str
    def __init__(self, execution: _Optional[str] = ...) -> None: ...

class AwaitResponse(_message.Message):
    __slots__ = ("execution", "output", "errors", "status", "performance", "events")
    class Status(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        STATUS_UNSPECIFIED: _ClassVar[AwaitResponse.Status]
        STATUS_COMPLETED: _ClassVar[AwaitResponse.Status]
        STATUS_EXECUTING: _ClassVar[AwaitResponse.Status]
    STATUS_UNSPECIFIED: AwaitResponse.Status
    STATUS_COMPLETED: AwaitResponse.Status
    STATUS_EXECUTING: AwaitResponse.Status
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    PERFORMANCE_FIELD_NUMBER: _ClassVar[int]
    EVENTS_FIELD_NUMBER: _ClassVar[int]
    execution: str
    output: _event_pb2.Output
    errors: _containers.RepeatedCompositeFieldContainer[_errors_pb2.Error]
    status: AwaitResponse.Status
    performance: _event_pb2.Performance
    events: _containers.RepeatedCompositeFieldContainer[_event_pb2.Event]
    def __init__(self, execution: _Optional[str] = ..., output: _Optional[_Union[_event_pb2.Output, _Mapping]] = ..., errors: _Optional[_Iterable[_Union[_errors_pb2.Error, _Mapping]]] = ..., status: _Optional[_Union[AwaitResponse.Status, str]] = ..., performance: _Optional[_Union[_event_pb2.Performance, _Mapping]] = ..., events: _Optional[_Iterable[_Union[_event_pb2.Event, _Mapping]]] = ...) -> None: ...

class AsyncResponse(_message.Message):
    __slots__ = ("execution", "error")
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    execution: str
    error: _errors_pb2.Error
    def __init__(self, execution: _Optional[str] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...

class StreamResponse(_message.Message):
    __slots__ = ("execution", "event")
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    EVENT_FIELD_NUMBER: _ClassVar[int]
    execution: str
    event: _event_pb2.Event
    def __init__(self, execution: _Optional[str] = ..., event: _Optional[_Union[_event_pb2.Event, _Mapping]] = ...) -> None: ...

class OutputRequest(_message.Message):
    __slots__ = ("execution", "block")
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    BLOCK_FIELD_NUMBER: _ClassVar[int]
    execution: str
    block: str
    def __init__(self, execution: _Optional[str] = ..., block: _Optional[str] = ...) -> None: ...

class OutputResponse(_message.Message):
    __slots__ = ("metadata", "output", "error")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    OUTPUT_FIELD_NUMBER: _ClassVar[int]
    ERROR_FIELD_NUMBER: _ClassVar[int]
    metadata: _common_pb2.Metadata
    output: _event_pb2.Output
    error: _errors_pb2.Error
    def __init__(self, metadata: _Optional[_Union[_common_pb2.Metadata, _Mapping]] = ..., output: _Optional[_Union[_event_pb2.Output, _Mapping]] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...

class CancelRequest(_message.Message):
    __slots__ = ("execution",)
    EXECUTION_FIELD_NUMBER: _ClassVar[int]
    execution: str
    def __init__(self, execution: _Optional[str] = ...) -> None: ...

class CancelResponse(_message.Message):
    __slots__ = ("error",)
    ERROR_FIELD_NUMBER: _ClassVar[int]
    error: _errors_pb2.Error
    def __init__(self, error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...

class TestRequest(_message.Message):
    __slots__ = ("datasource_config", "integration_type", "configuration_id", "profile", "action_config")
    DATASOURCE_CONFIG_FIELD_NUMBER: _ClassVar[int]
    INTEGRATION_TYPE_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    ACTION_CONFIG_FIELD_NUMBER: _ClassVar[int]
    datasource_config: _struct_pb2.Struct
    integration_type: str
    configuration_id: str
    profile: _common_pb2.Profile
    action_config: _struct_pb2.Struct
    def __init__(self, datasource_config: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., integration_type: _Optional[str] = ..., configuration_id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., action_config: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...

class TestResponse(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class DeleteRequest(_message.Message):
    __slots__ = ("integration", "profile", "configuration_id", "plugin_name")
    INTEGRATION_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    PLUGIN_NAME_FIELD_NUMBER: _ClassVar[int]
    integration: str
    profile: _common_pb2.Profile
    configuration_id: str
    plugin_name: str
    def __init__(self, integration: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., configuration_id: _Optional[str] = ..., plugin_name: _Optional[str] = ...) -> None: ...

class DeleteResponse(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class Function(_message.Message):
    __slots__ = ()
    class Request(_message.Message):
        __slots__ = ("id", "name", "parameters")
        ID_FIELD_NUMBER: _ClassVar[int]
        NAME_FIELD_NUMBER: _ClassVar[int]
        PARAMETERS_FIELD_NUMBER: _ClassVar[int]
        id: str
        name: str
        parameters: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Value]
        def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ..., parameters: _Optional[_Iterable[_Union[_struct_pb2.Value, _Mapping]]] = ...) -> None: ...
    class Response(_message.Message):
        __slots__ = ("id", "value", "error")
        ID_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        id: str
        value: _struct_pb2.Value
        error: _errors_pb2.Error
        def __init__(self, id: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...
    def __init__(self) -> None: ...

class TwoWayRequest(_message.Message):
    __slots__ = ("execute", "function")
    EXECUTE_FIELD_NUMBER: _ClassVar[int]
    FUNCTION_FIELD_NUMBER: _ClassVar[int]
    execute: ExecuteRequest
    function: Function.Response
    def __init__(self, execute: _Optional[_Union[ExecuteRequest, _Mapping]] = ..., function: _Optional[_Union[Function.Response, _Mapping]] = ...) -> None: ...

class TwoWayResponse(_message.Message):
    __slots__ = ("stream", "function")
    STREAM_FIELD_NUMBER: _ClassVar[int]
    FUNCTION_FIELD_NUMBER: _ClassVar[int]
    stream: StreamResponse
    function: Function.Request
    def __init__(self, stream: _Optional[_Union[StreamResponse, _Mapping]] = ..., function: _Optional[_Union[Function.Request, _Mapping]] = ...) -> None: ...

class Mock(_message.Message):
    __slots__ = ("on",)
    class Params(_message.Message):
        __slots__ = ("integration_type", "step_name", "inputs")
        INTEGRATION_TYPE_FIELD_NUMBER: _ClassVar[int]
        STEP_NAME_FIELD_NUMBER: _ClassVar[int]
        INPUTS_FIELD_NUMBER: _ClassVar[int]
        integration_type: str
        step_name: str
        inputs: _struct_pb2.Value
        def __init__(self, integration_type: _Optional[str] = ..., step_name: _Optional[str] = ..., inputs: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
    class On(_message.Message):
        __slots__ = ("static", "dynamic")
        STATIC_FIELD_NUMBER: _ClassVar[int]
        DYNAMIC_FIELD_NUMBER: _ClassVar[int]
        static: Mock.Params
        dynamic: str
        def __init__(self, static: _Optional[_Union[Mock.Params, _Mapping]] = ..., dynamic: _Optional[str] = ...) -> None: ...
    class Return(_message.Message):
        __slots__ = ("static", "dynamic")
        STATIC_FIELD_NUMBER: _ClassVar[int]
        DYNAMIC_FIELD_NUMBER: _ClassVar[int]
        static: _struct_pb2.Value
        dynamic: str
        def __init__(self, static: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., dynamic: _Optional[str] = ...) -> None: ...
    ON_FIELD_NUMBER: _ClassVar[int]
    RETURN_FIELD_NUMBER: _ClassVar[int]
    on: Mock.On
    def __init__(self, on: _Optional[_Union[Mock.On, _Mapping]] = ..., **kwargs) -> None: ...

class MetadataRequestDeprecated(_message.Message):
    __slots__ = ("integration", "api_id", "profile")
    INTEGRATION_FIELD_NUMBER: _ClassVar[int]
    API_ID_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    integration: str
    api_id: str
    profile: _common_pb2.Profile
    def __init__(self, integration: _Optional[str] = ..., api_id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ...) -> None: ...

class MetadataRequest(_message.Message):
    __slots__ = ("integration", "profile", "step_configuration")
    INTEGRATION_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    STEP_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    integration: str
    profile: _common_pb2.Profile
    step_configuration: _struct_pb2.Struct
    def __init__(self, integration: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., step_configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ...) -> None: ...

class MetadataResponse(_message.Message):
    __slots__ = ("database_schema_metadata", "buckets_metadata", "couchbase", "kafka", "kinesis", "cosmosdb", "adls", "graphql", "dynamodb", "salesforce", "open_api_spec", "g_sheets_next_page_token", "load_disabled")
    class DatabaseSchemaMetadata(_message.Message):
        __slots__ = ("tables", "schemas")
        class Column(_message.Message):
            __slots__ = ("name", "type", "escaped_name")
            NAME_FIELD_NUMBER: _ClassVar[int]
            TYPE_FIELD_NUMBER: _ClassVar[int]
            ESCAPED_NAME_FIELD_NUMBER: _ClassVar[int]
            name: str
            type: str
            escaped_name: str
            def __init__(self, name: _Optional[str] = ..., type: _Optional[str] = ..., escaped_name: _Optional[str] = ...) -> None: ...
        class Key(_message.Message):
            __slots__ = ("name", "type", "columns")
            NAME_FIELD_NUMBER: _ClassVar[int]
            TYPE_FIELD_NUMBER: _ClassVar[int]
            COLUMNS_FIELD_NUMBER: _ClassVar[int]
            name: str
            type: str
            columns: _containers.RepeatedScalarFieldContainer[str]
            def __init__(self, name: _Optional[str] = ..., type: _Optional[str] = ..., columns: _Optional[_Iterable[str]] = ...) -> None: ...
        class Template(_message.Message):
            __slots__ = ("title", "body")
            TITLE_FIELD_NUMBER: _ClassVar[int]
            BODY_FIELD_NUMBER: _ClassVar[int]
            title: str
            body: str
            def __init__(self, title: _Optional[str] = ..., body: _Optional[str] = ...) -> None: ...
        class Table(_message.Message):
            __slots__ = ("id", "type", "name", "columns", "keys", "templates", "schema")
            ID_FIELD_NUMBER: _ClassVar[int]
            TYPE_FIELD_NUMBER: _ClassVar[int]
            NAME_FIELD_NUMBER: _ClassVar[int]
            COLUMNS_FIELD_NUMBER: _ClassVar[int]
            KEYS_FIELD_NUMBER: _ClassVar[int]
            TEMPLATES_FIELD_NUMBER: _ClassVar[int]
            SCHEMA_FIELD_NUMBER: _ClassVar[int]
            id: str
            type: str
            name: str
            columns: _containers.RepeatedCompositeFieldContainer[MetadataResponse.DatabaseSchemaMetadata.Column]
            keys: _containers.RepeatedCompositeFieldContainer[MetadataResponse.DatabaseSchemaMetadata.Key]
            templates: _containers.RepeatedCompositeFieldContainer[MetadataResponse.DatabaseSchemaMetadata.Template]
            schema: str
            def __init__(self, id: _Optional[str] = ..., type: _Optional[str] = ..., name: _Optional[str] = ..., columns: _Optional[_Iterable[_Union[MetadataResponse.DatabaseSchemaMetadata.Column, _Mapping]]] = ..., keys: _Optional[_Iterable[_Union[MetadataResponse.DatabaseSchemaMetadata.Key, _Mapping]]] = ..., templates: _Optional[_Iterable[_Union[MetadataResponse.DatabaseSchemaMetadata.Template, _Mapping]]] = ..., schema: _Optional[str] = ...) -> None: ...
        class Schema(_message.Message):
            __slots__ = ("id", "name")
            ID_FIELD_NUMBER: _ClassVar[int]
            NAME_FIELD_NUMBER: _ClassVar[int]
            id: str
            name: str
            def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ...) -> None: ...
        TABLES_FIELD_NUMBER: _ClassVar[int]
        SCHEMAS_FIELD_NUMBER: _ClassVar[int]
        tables: _containers.RepeatedCompositeFieldContainer[MetadataResponse.DatabaseSchemaMetadata.Table]
        schemas: _containers.RepeatedCompositeFieldContainer[MetadataResponse.DatabaseSchemaMetadata.Schema]
        def __init__(self, tables: _Optional[_Iterable[_Union[MetadataResponse.DatabaseSchemaMetadata.Table, _Mapping]]] = ..., schemas: _Optional[_Iterable[_Union[MetadataResponse.DatabaseSchemaMetadata.Schema, _Mapping]]] = ...) -> None: ...
    class BucketMetadata(_message.Message):
        __slots__ = ("name",)
        NAME_FIELD_NUMBER: _ClassVar[int]
        name: str
        def __init__(self, name: _Optional[str] = ...) -> None: ...
    class BucketsMetadata(_message.Message):
        __slots__ = ("buckets",)
        BUCKETS_FIELD_NUMBER: _ClassVar[int]
        buckets: _containers.RepeatedCompositeFieldContainer[MetadataResponse.BucketMetadata]
        def __init__(self, buckets: _Optional[_Iterable[_Union[MetadataResponse.BucketMetadata, _Mapping]]] = ...) -> None: ...
    DATABASE_SCHEMA_METADATA_FIELD_NUMBER: _ClassVar[int]
    BUCKETS_METADATA_FIELD_NUMBER: _ClassVar[int]
    COUCHBASE_FIELD_NUMBER: _ClassVar[int]
    KAFKA_FIELD_NUMBER: _ClassVar[int]
    KINESIS_FIELD_NUMBER: _ClassVar[int]
    COSMOSDB_FIELD_NUMBER: _ClassVar[int]
    ADLS_FIELD_NUMBER: _ClassVar[int]
    GRAPHQL_FIELD_NUMBER: _ClassVar[int]
    DYNAMODB_FIELD_NUMBER: _ClassVar[int]
    SALESFORCE_FIELD_NUMBER: _ClassVar[int]
    OPEN_API_SPEC_FIELD_NUMBER: _ClassVar[int]
    G_SHEETS_NEXT_PAGE_TOKEN_FIELD_NUMBER: _ClassVar[int]
    LOAD_DISABLED_FIELD_NUMBER: _ClassVar[int]
    database_schema_metadata: MetadataResponse.DatabaseSchemaMetadata
    buckets_metadata: MetadataResponse.BucketsMetadata
    couchbase: _plugin_pb2_1_1.Metadata
    kafka: _plugin_pb2_1_1_1_1.Metadata
    kinesis: _plugin_pb2_1_1_1_1_1.Metadata
    cosmosdb: _plugin_pb2_1.Plugin.Metadata
    adls: _plugin_pb2.Plugin.Metadata
    graphql: _struct_pb2.Struct
    dynamodb: _plugin_pb2_1_1_1.Metadata
    salesforce: _plugin_pb2_1_1_1_1_1_1.Plugin.Metadata
    open_api_spec: _struct_pb2.Struct
    g_sheets_next_page_token: str
    load_disabled: bool
    def __init__(self, database_schema_metadata: _Optional[_Union[MetadataResponse.DatabaseSchemaMetadata, _Mapping]] = ..., buckets_metadata: _Optional[_Union[MetadataResponse.BucketsMetadata, _Mapping]] = ..., couchbase: _Optional[_Union[_plugin_pb2_1_1.Metadata, _Mapping]] = ..., kafka: _Optional[_Union[_plugin_pb2_1_1_1_1.Metadata, _Mapping]] = ..., kinesis: _Optional[_Union[_plugin_pb2_1_1_1_1_1.Metadata, _Mapping]] = ..., cosmosdb: _Optional[_Union[_plugin_pb2_1.Plugin.Metadata, _Mapping]] = ..., adls: _Optional[_Union[_plugin_pb2.Plugin.Metadata, _Mapping]] = ..., graphql: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., dynamodb: _Optional[_Union[_plugin_pb2_1_1_1.Metadata, _Mapping]] = ..., salesforce: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1.Plugin.Metadata, _Mapping]] = ..., open_api_spec: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., g_sheets_next_page_token: _Optional[str] = ..., load_disabled: bool = ...) -> None: ...

class DownloadRequest(_message.Message):
    __slots__ = ("location",)
    LOCATION_FIELD_NUMBER: _ClassVar[int]
    location: str
    def __init__(self, location: _Optional[str] = ...) -> None: ...

class DownloadResponse(_message.Message):
    __slots__ = ("data",)
    DATA_FIELD_NUMBER: _ClassVar[int]
    data: bytes
    def __init__(self, data: _Optional[bytes] = ...) -> None: ...

class WorkflowResponse(_message.Message):
    __slots__ = ("data", "response_meta")
    class ResponseMeta(_message.Message):
        __slots__ = ("status", "message", "success")
        STATUS_FIELD_NUMBER: _ClassVar[int]
        MESSAGE_FIELD_NUMBER: _ClassVar[int]
        SUCCESS_FIELD_NUMBER: _ClassVar[int]
        status: int
        message: str
        success: bool
        def __init__(self, status: _Optional[int] = ..., message: _Optional[str] = ..., success: bool = ...) -> None: ...
    DATA_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_META_FIELD_NUMBER: _ClassVar[int]
    data: _struct_pb2.Value
    response_meta: WorkflowResponse.ResponseMeta
    def __init__(self, data: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., response_meta: _Optional[_Union[WorkflowResponse.ResponseMeta, _Mapping]] = ...) -> None: ...
