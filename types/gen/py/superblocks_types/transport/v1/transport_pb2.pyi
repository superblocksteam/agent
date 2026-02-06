from api.v1 import api_pb2 as _api_pb2
from api.v1 import blocks_pb2 as _blocks_pb2
from api.v1 import service_pb2 as _service_pb2
from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import errors_pb2 as _errors_pb2
from google.protobuf import any_pb2 as _any_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from plugins.adls.v1 import plugin_pb2 as _plugin_pb2
from plugins.cosmosdb.v1 import plugin_pb2 as _plugin_pb2_1
from plugins.couchbase.v1 import plugin_pb2 as _plugin_pb2_1_1
from plugins.kafka.v1 import plugin_pb2 as _plugin_pb2_1_1_1
from plugins.kinesis.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1
from plugins.salesforce.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1
from store.v1 import store_pb2 as _store_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Performance(_message.Message):
    __slots__ = ("error", "plugin_execution", "queue_request", "queue_response", "kv_store_fetch", "kv_store_push", "total")
    class Observable(_message.Message):
        __slots__ = ("start", "end", "value", "bytes", "estimate")
        START_FIELD_NUMBER: _ClassVar[int]
        END_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        BYTES_FIELD_NUMBER: _ClassVar[int]
        ESTIMATE_FIELD_NUMBER: _ClassVar[int]
        start: float
        end: float
        value: float
        bytes: float
        estimate: float
        def __init__(self, start: _Optional[float] = ..., end: _Optional[float] = ..., value: _Optional[float] = ..., bytes: _Optional[float] = ..., estimate: _Optional[float] = ...) -> None: ...
    ERROR_FIELD_NUMBER: _ClassVar[int]
    PLUGIN_EXECUTION_FIELD_NUMBER: _ClassVar[int]
    QUEUE_REQUEST_FIELD_NUMBER: _ClassVar[int]
    QUEUE_RESPONSE_FIELD_NUMBER: _ClassVar[int]
    KV_STORE_FETCH_FIELD_NUMBER: _ClassVar[int]
    KV_STORE_PUSH_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    error: bool
    plugin_execution: Performance.Observable
    queue_request: Performance.Observable
    queue_response: Performance.Observable
    kv_store_fetch: Performance.Observable
    kv_store_push: Performance.Observable
    total: Performance.Observable
    def __init__(self, error: bool = ..., plugin_execution: _Optional[_Union[Performance.Observable, _Mapping]] = ..., queue_request: _Optional[_Union[Performance.Observable, _Mapping]] = ..., queue_response: _Optional[_Union[Performance.Observable, _Mapping]] = ..., kv_store_fetch: _Optional[_Union[Performance.Observable, _Mapping]] = ..., kv_store_push: _Optional[_Union[Performance.Observable, _Mapping]] = ..., total: _Optional[_Union[Performance.Observable, _Mapping]] = ...) -> None: ...

class Variable(_message.Message):
    __slots__ = ("key", "type", "mode")
    KEY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    MODE_FIELD_NUMBER: _ClassVar[int]
    key: str
    type: _blocks_pb2.Variables.Type
    mode: _blocks_pb2.Variables.Mode
    def __init__(self, key: _Optional[str] = ..., type: _Optional[_Union[_blocks_pb2.Variables.Type, str]] = ..., mode: _Optional[_Union[_blocks_pb2.Variables.Mode, str]] = ...) -> None: ...

class Observability(_message.Message):
    __slots__ = ("trace_id", "span_id", "baggage", "trace_flags")
    class BaggageEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    TRACE_ID_FIELD_NUMBER: _ClassVar[int]
    SPAN_ID_FIELD_NUMBER: _ClassVar[int]
    BAGGAGE_FIELD_NUMBER: _ClassVar[int]
    TRACE_FLAGS_FIELD_NUMBER: _ClassVar[int]
    trace_id: str
    span_id: str
    baggage: _containers.ScalarMap[str, str]
    trace_flags: bytes
    def __init__(self, trace_id: _Optional[str] = ..., span_id: _Optional[str] = ..., baggage: _Optional[_Mapping[str, str]] = ..., trace_flags: _Optional[bytes] = ...) -> None: ...

class Request(_message.Message):
    __slots__ = ("inbox", "data", "topic")
    class Data(_message.Message):
        __slots__ = ("pinned", "data")
        class Pinned(_message.Message):
            __slots__ = ("bucket", "name", "version", "event", "carrier", "observability")
            class CarrierEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: str
                def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
            BUCKET_FIELD_NUMBER: _ClassVar[int]
            NAME_FIELD_NUMBER: _ClassVar[int]
            VERSION_FIELD_NUMBER: _ClassVar[int]
            EVENT_FIELD_NUMBER: _ClassVar[int]
            CARRIER_FIELD_NUMBER: _ClassVar[int]
            OBSERVABILITY_FIELD_NUMBER: _ClassVar[int]
            bucket: str
            name: str
            version: str
            event: str
            carrier: _containers.ScalarMap[str, str]
            observability: Observability
            def __init__(self, bucket: _Optional[str] = ..., name: _Optional[str] = ..., version: _Optional[str] = ..., event: _Optional[str] = ..., carrier: _Optional[_Mapping[str, str]] = ..., observability: _Optional[_Union[Observability, _Mapping]] = ...) -> None: ...
        class Data(_message.Message):
            __slots__ = ("props", "d_config", "a_config", "quotas")
            class Props(_message.Message):
                __slots__ = ("action_configuration", "datasource_configuration", "redacted_datasource_configuration", "execution_id", "step_name", "environment", "binding_keys", "variables", "fileServerUrl", "files", "render", "version", "use_wasm_bindings_sandbox")
                class Binding(_message.Message):
                    __slots__ = ("key", "type")
                    KEY_FIELD_NUMBER: _ClassVar[int]
                    TYPE_FIELD_NUMBER: _ClassVar[int]
                    key: str
                    type: str
                    def __init__(self, key: _Optional[str] = ..., type: _Optional[str] = ...) -> None: ...
                class File(_message.Message):
                    __slots__ = ("fieldname", "originalname", "encoding", "mimetype", "size", "destination", "filename", "path", "buffer")
                    FIELDNAME_FIELD_NUMBER: _ClassVar[int]
                    ORIGINALNAME_FIELD_NUMBER: _ClassVar[int]
                    ENCODING_FIELD_NUMBER: _ClassVar[int]
                    MIMETYPE_FIELD_NUMBER: _ClassVar[int]
                    SIZE_FIELD_NUMBER: _ClassVar[int]
                    DESTINATION_FIELD_NUMBER: _ClassVar[int]
                    FILENAME_FIELD_NUMBER: _ClassVar[int]
                    PATH_FIELD_NUMBER: _ClassVar[int]
                    BUFFER_FIELD_NUMBER: _ClassVar[int]
                    fieldname: str
                    originalname: str
                    encoding: str
                    mimetype: str
                    size: int
                    destination: str
                    filename: str
                    path: str
                    buffer: bytes
                    def __init__(self, fieldname: _Optional[str] = ..., originalname: _Optional[str] = ..., encoding: _Optional[str] = ..., mimetype: _Optional[str] = ..., size: _Optional[int] = ..., destination: _Optional[str] = ..., filename: _Optional[str] = ..., path: _Optional[str] = ..., buffer: _Optional[bytes] = ...) -> None: ...
                class VariablesEntry(_message.Message):
                    __slots__ = ("key", "value")
                    KEY_FIELD_NUMBER: _ClassVar[int]
                    VALUE_FIELD_NUMBER: _ClassVar[int]
                    key: str
                    value: Variable
                    def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Variable, _Mapping]] = ...) -> None: ...
                ACTION_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
                DATASOURCE_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
                REDACTED_DATASOURCE_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
                EXECUTION_ID_FIELD_NUMBER: _ClassVar[int]
                STEP_NAME_FIELD_NUMBER: _ClassVar[int]
                ENVIRONMENT_FIELD_NUMBER: _ClassVar[int]
                BINDING_KEYS_FIELD_NUMBER: _ClassVar[int]
                VARIABLES_FIELD_NUMBER: _ClassVar[int]
                FILESERVERURL_FIELD_NUMBER: _ClassVar[int]
                FILES_FIELD_NUMBER: _ClassVar[int]
                RENDER_FIELD_NUMBER: _ClassVar[int]
                VERSION_FIELD_NUMBER: _ClassVar[int]
                USE_WASM_BINDINGS_SANDBOX_FIELD_NUMBER: _ClassVar[int]
                action_configuration: _struct_pb2.Struct
                datasource_configuration: _struct_pb2.Struct
                redacted_datasource_configuration: _struct_pb2.Struct
                execution_id: str
                step_name: str
                environment: str
                binding_keys: _containers.RepeatedCompositeFieldContainer[Request.Data.Data.Props.Binding]
                variables: _containers.MessageMap[str, Variable]
                fileServerUrl: str
                files: _containers.RepeatedCompositeFieldContainer[Request.Data.Data.Props.File]
                render: bool
                version: str
                use_wasm_bindings_sandbox: bool
                def __init__(self, action_configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., datasource_configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., redacted_datasource_configuration: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., execution_id: _Optional[str] = ..., step_name: _Optional[str] = ..., environment: _Optional[str] = ..., binding_keys: _Optional[_Iterable[_Union[Request.Data.Data.Props.Binding, _Mapping]]] = ..., variables: _Optional[_Mapping[str, Variable]] = ..., fileServerUrl: _Optional[str] = ..., files: _Optional[_Iterable[_Union[Request.Data.Data.Props.File, _Mapping]]] = ..., render: bool = ..., version: _Optional[str] = ..., use_wasm_bindings_sandbox: bool = ...) -> None: ...
            class Quota(_message.Message):
                __slots__ = ("size", "duration")
                SIZE_FIELD_NUMBER: _ClassVar[int]
                DURATION_FIELD_NUMBER: _ClassVar[int]
                size: int
                duration: int
                def __init__(self, size: _Optional[int] = ..., duration: _Optional[int] = ...) -> None: ...
            PROPS_FIELD_NUMBER: _ClassVar[int]
            D_CONFIG_FIELD_NUMBER: _ClassVar[int]
            A_CONFIG_FIELD_NUMBER: _ClassVar[int]
            QUOTAS_FIELD_NUMBER: _ClassVar[int]
            props: Request.Data.Data.Props
            d_config: _struct_pb2.Struct
            a_config: _struct_pb2.Struct
            quotas: Request.Data.Data.Quota
            def __init__(self, props: _Optional[_Union[Request.Data.Data.Props, _Mapping]] = ..., d_config: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., a_config: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., quotas: _Optional[_Union[Request.Data.Data.Quota, _Mapping]] = ...) -> None: ...
        PINNED_FIELD_NUMBER: _ClassVar[int]
        DATA_FIELD_NUMBER: _ClassVar[int]
        pinned: Request.Data.Pinned
        data: Request.Data.Data
        def __init__(self, pinned: _Optional[_Union[Request.Data.Pinned, _Mapping]] = ..., data: _Optional[_Union[Request.Data.Data, _Mapping]] = ...) -> None: ...
    INBOX_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    TOPIC_FIELD_NUMBER: _ClassVar[int]
    inbox: str
    data: Request.Data
    topic: str
    def __init__(self, inbox: _Optional[str] = ..., data: _Optional[_Union[Request.Data, _Mapping]] = ..., topic: _Optional[str] = ...) -> None: ...

class Response(_message.Message):
    __slots__ = ("data", "pinned")
    class Data(_message.Message):
        __slots__ = ("pinned", "data")
        class Data(_message.Message):
            __slots__ = ("key", "err", "db_schema", "buckets", "couchbase", "kafka", "kinesis", "cosmosdb", "adls", "dynamodb", "g_sheets_next_page_token", "graphql", "open_api_spec", "salesforce", "load_disabled")
            KEY_FIELD_NUMBER: _ClassVar[int]
            ERR_FIELD_NUMBER: _ClassVar[int]
            DB_SCHEMA_FIELD_NUMBER: _ClassVar[int]
            BUCKETS_FIELD_NUMBER: _ClassVar[int]
            COUCHBASE_FIELD_NUMBER: _ClassVar[int]
            KAFKA_FIELD_NUMBER: _ClassVar[int]
            KINESIS_FIELD_NUMBER: _ClassVar[int]
            COSMOSDB_FIELD_NUMBER: _ClassVar[int]
            ADLS_FIELD_NUMBER: _ClassVar[int]
            DYNAMODB_FIELD_NUMBER: _ClassVar[int]
            G_SHEETS_NEXT_PAGE_TOKEN_FIELD_NUMBER: _ClassVar[int]
            GRAPHQL_FIELD_NUMBER: _ClassVar[int]
            OPEN_API_SPEC_FIELD_NUMBER: _ClassVar[int]
            SALESFORCE_FIELD_NUMBER: _ClassVar[int]
            LOAD_DISABLED_FIELD_NUMBER: _ClassVar[int]
            key: str
            err: _errors_pb2.Error
            db_schema: _service_pb2.MetadataResponse.DatabaseSchemaMetadata
            buckets: _containers.RepeatedCompositeFieldContainer[_service_pb2.MetadataResponse.BucketMetadata]
            couchbase: _plugin_pb2_1_1.Metadata
            kafka: _plugin_pb2_1_1_1.Metadata
            kinesis: _plugin_pb2_1_1_1_1.Metadata
            cosmosdb: _plugin_pb2_1.Plugin.Metadata
            adls: _plugin_pb2.Plugin.Metadata
            dynamodb: _any_pb2.Any
            g_sheets_next_page_token: str
            graphql: _struct_pb2.Struct
            open_api_spec: _struct_pb2.Struct
            salesforce: _plugin_pb2_1_1_1_1_1.Plugin.Metadata
            load_disabled: bool
            def __init__(self, key: _Optional[str] = ..., err: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ..., db_schema: _Optional[_Union[_service_pb2.MetadataResponse.DatabaseSchemaMetadata, _Mapping]] = ..., buckets: _Optional[_Iterable[_Union[_service_pb2.MetadataResponse.BucketMetadata, _Mapping]]] = ..., couchbase: _Optional[_Union[_plugin_pb2_1_1.Metadata, _Mapping]] = ..., kafka: _Optional[_Union[_plugin_pb2_1_1_1.Metadata, _Mapping]] = ..., kinesis: _Optional[_Union[_plugin_pb2_1_1_1_1.Metadata, _Mapping]] = ..., cosmosdb: _Optional[_Union[_plugin_pb2_1.Plugin.Metadata, _Mapping]] = ..., adls: _Optional[_Union[_plugin_pb2.Plugin.Metadata, _Mapping]] = ..., dynamodb: _Optional[_Union[_any_pb2.Any, _Mapping]] = ..., g_sheets_next_page_token: _Optional[str] = ..., graphql: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., open_api_spec: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., salesforce: _Optional[_Union[_plugin_pb2_1_1_1_1_1.Plugin.Metadata, _Mapping]] = ..., load_disabled: bool = ...) -> None: ...
        PINNED_FIELD_NUMBER: _ClassVar[int]
        DATA_FIELD_NUMBER: _ClassVar[int]
        pinned: Performance
        data: Response.Data.Data
        def __init__(self, pinned: _Optional[_Union[Performance, _Mapping]] = ..., data: _Optional[_Union[Response.Data.Data, _Mapping]] = ...) -> None: ...
    DATA_FIELD_NUMBER: _ClassVar[int]
    PINNED_FIELD_NUMBER: _ClassVar[int]
    data: Response.Data
    pinned: _errors_pb2.Error
    def __init__(self, data: _Optional[_Union[Response.Data, _Mapping]] = ..., pinned: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...

class Fetch(_message.Message):
    __slots__ = ("api", "integrations", "metadata", "stores")
    class Metadata(_message.Message):
        __slots__ = ("requester", "profile", "organization_plan")
        REQUESTER_FIELD_NUMBER: _ClassVar[int]
        PROFILE_FIELD_NUMBER: _ClassVar[int]
        ORGANIZATION_PLAN_FIELD_NUMBER: _ClassVar[int]
        requester: str
        profile: str
        organization_plan: str
        def __init__(self, requester: _Optional[str] = ..., profile: _Optional[str] = ..., organization_plan: _Optional[str] = ...) -> None: ...
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
    metadata: Fetch.Metadata
    stores: _store_pb2.Stores
    def __init__(self, api: _Optional[_Union[_api_pb2.Api, _Mapping]] = ..., integrations: _Optional[_Mapping[str, _struct_pb2.Struct]] = ..., metadata: _Optional[_Union[Fetch.Metadata, _Mapping]] = ..., stores: _Optional[_Union[_store_pb2.Stores, _Mapping]] = ...) -> None: ...

class FetchScheduleJobResp(_message.Message):
    __slots__ = ("apis",)
    APIS_FIELD_NUMBER: _ClassVar[int]
    apis: _containers.RepeatedCompositeFieldContainer[_service_pb2.Definition]
    def __init__(self, apis: _Optional[_Iterable[_Union[_service_pb2.Definition, _Mapping]]] = ...) -> None: ...
