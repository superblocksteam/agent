from api.v1 import blocks_pb2 as _blocks_pb2
from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import common_pb2 as _common_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from plugins.adls.v1 import plugin_pb2 as _plugin_pb2
from plugins.athena.v1 import plugin_pb2 as _plugin_pb2_1
from plugins.bigquery.v1 import plugin_pb2 as _plugin_pb2_1_1
from plugins.cockroachdb.v1 import plugin_pb2 as _plugin_pb2_1_1_1
from plugins.cosmosdb.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1
from plugins.couchbase.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1
from plugins.custom.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1
from plugins.databricks.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1
from plugins.dynamodb.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1
from plugins.email.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1
from plugins.gcs.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1
from plugins.graphql.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1
from plugins.gsheets.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.javascript.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.kafka.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.kinesis.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.lakebase.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.mariadb.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.mongodb.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.mssql.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.mysql.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.ocr.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.openai.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.oracledb.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.pinecone.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.postgresql.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.python.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.redis.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.redshift.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.restapi.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.restapiintegration.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.rockset.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.s3.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.salesforce.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.smtp.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.snowflake.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from plugins.workflow.v1 import plugin_pb2 as _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1
from superblocks.v1 import options_pb2 as _options_pb2
from utils.v1 import utils_pb2 as _utils_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class AuthorizationType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    AUTHORIZATION_TYPE_UNSPECIFIED: _ClassVar[AuthorizationType]
    AUTHORIZATION_TYPE_APP_USERS: _ClassVar[AuthorizationType]
    AUTHORIZATION_TYPE_JS_EXPRESSION: _ClassVar[AuthorizationType]
AUTHORIZATION_TYPE_UNSPECIFIED: AuthorizationType
AUTHORIZATION_TYPE_APP_USERS: AuthorizationType
AUTHORIZATION_TYPE_JS_EXPRESSION: AuthorizationType

class Api(_message.Message):
    __slots__ = ("metadata", "blocks", "trigger", "signature", "authorization")
    METADATA_FIELD_NUMBER: _ClassVar[int]
    BLOCKS_FIELD_NUMBER: _ClassVar[int]
    TRIGGER_FIELD_NUMBER: _ClassVar[int]
    SIGNATURE_FIELD_NUMBER: _ClassVar[int]
    AUTHORIZATION_FIELD_NUMBER: _ClassVar[int]
    metadata: _common_pb2.Metadata
    blocks: _containers.RepeatedCompositeFieldContainer[Block]
    trigger: Trigger
    signature: _utils_pb2.Signature
    authorization: Authorization
    def __init__(self, metadata: _Optional[_Union[_common_pb2.Metadata, _Mapping]] = ..., blocks: _Optional[_Iterable[_Union[Block, _Mapping]]] = ..., trigger: _Optional[_Union[Trigger, _Mapping]] = ..., signature: _Optional[_Union[_utils_pb2.Signature, _Mapping]] = ..., authorization: _Optional[_Union[Authorization, _Mapping]] = ...) -> None: ...

class Authorization(_message.Message):
    __slots__ = ("type", "expression")
    TYPE_FIELD_NUMBER: _ClassVar[int]
    EXPRESSION_FIELD_NUMBER: _ClassVar[int]
    type: AuthorizationType
    expression: str
    def __init__(self, type: _Optional[_Union[AuthorizationType, str]] = ..., expression: _Optional[str] = ...) -> None: ...

class Profiles(_message.Message):
    __slots__ = ("modes",)
    class Modes(_message.Message):
        __slots__ = ("editor", "preview", "deployed")
        class Settings(_message.Message):
            __slots__ = ("default", "available")
            DEFAULT_FIELD_NUMBER: _ClassVar[int]
            AVAILABLE_FIELD_NUMBER: _ClassVar[int]
            default: str
            available: _containers.RepeatedScalarFieldContainer[str]
            def __init__(self, default: _Optional[str] = ..., available: _Optional[_Iterable[str]] = ...) -> None: ...
        EDITOR_FIELD_NUMBER: _ClassVar[int]
        PREVIEW_FIELD_NUMBER: _ClassVar[int]
        DEPLOYED_FIELD_NUMBER: _ClassVar[int]
        editor: Profiles.Modes.Settings
        preview: Profiles.Modes.Settings
        deployed: Profiles.Modes.Settings
        def __init__(self, editor: _Optional[_Union[Profiles.Modes.Settings, _Mapping]] = ..., preview: _Optional[_Union[Profiles.Modes.Settings, _Mapping]] = ..., deployed: _Optional[_Union[Profiles.Modes.Settings, _Mapping]] = ...) -> None: ...
    MODES_FIELD_NUMBER: _ClassVar[int]
    modes: Profiles.Modes
    def __init__(self, modes: _Optional[_Union[Profiles.Modes, _Mapping]] = ...) -> None: ...

class Trigger(_message.Message):
    __slots__ = ("application", "workflow", "job")
    class Application(_message.Message):
        __slots__ = ("options", "id", "page_id")
        class Options(_message.Message):
            __slots__ = ("execute_on_page_load",)
            EXECUTE_ON_PAGE_LOAD_FIELD_NUMBER: _ClassVar[int]
            execute_on_page_load: bool
            def __init__(self, execute_on_page_load: bool = ...) -> None: ...
        OPTIONS_FIELD_NUMBER: _ClassVar[int]
        ID_FIELD_NUMBER: _ClassVar[int]
        PAGE_ID_FIELD_NUMBER: _ClassVar[int]
        options: Trigger.Application.Options
        id: str
        page_id: str
        def __init__(self, options: _Optional[_Union[Trigger.Application.Options, _Mapping]] = ..., id: _Optional[str] = ..., page_id: _Optional[str] = ...) -> None: ...
    class Workflow(_message.Message):
        __slots__ = ("options", "parameters")
        class Options(_message.Message):
            __slots__ = ("profiles", "deployedCommitId")
            PROFILES_FIELD_NUMBER: _ClassVar[int]
            DEPLOYEDCOMMITID_FIELD_NUMBER: _ClassVar[int]
            profiles: Profiles
            deployedCommitId: str
            def __init__(self, profiles: _Optional[_Union[Profiles, _Mapping]] = ..., deployedCommitId: _Optional[str] = ...) -> None: ...
        class Parameters(_message.Message):
            __slots__ = ("query", "body")
            class QueryParam(_message.Message):
                __slots__ = ("values",)
                VALUES_FIELD_NUMBER: _ClassVar[int]
                values: _containers.RepeatedScalarFieldContainer[str]
                def __init__(self, values: _Optional[_Iterable[str]] = ...) -> None: ...
            class QueryEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: Trigger.Workflow.Parameters.QueryParam
                def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Trigger.Workflow.Parameters.QueryParam, _Mapping]] = ...) -> None: ...
            class BodyEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: _struct_pb2.Value
                def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ...) -> None: ...
            QUERY_FIELD_NUMBER: _ClassVar[int]
            BODY_FIELD_NUMBER: _ClassVar[int]
            query: _containers.MessageMap[str, Trigger.Workflow.Parameters.QueryParam]
            body: _containers.MessageMap[str, _struct_pb2.Value]
            def __init__(self, query: _Optional[_Mapping[str, Trigger.Workflow.Parameters.QueryParam]] = ..., body: _Optional[_Mapping[str, _struct_pb2.Value]] = ...) -> None: ...
        OPTIONS_FIELD_NUMBER: _ClassVar[int]
        PARAMETERS_FIELD_NUMBER: _ClassVar[int]
        options: Trigger.Workflow.Options
        parameters: Trigger.Workflow.Parameters
        def __init__(self, options: _Optional[_Union[Trigger.Workflow.Options, _Mapping]] = ..., parameters: _Optional[_Union[Trigger.Workflow.Parameters, _Mapping]] = ...) -> None: ...
    class Job(_message.Message):
        __slots__ = ("options", "frequency", "interval", "day_of_month", "days", "time", "timezone_locale")
        class Interval(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            INTERVAL_UNSPECIFIED: _ClassVar[Trigger.Job.Interval]
            INTERVAL_MINUTE: _ClassVar[Trigger.Job.Interval]
            INTERVAL_HOUR: _ClassVar[Trigger.Job.Interval]
            INTERVAL_DAY: _ClassVar[Trigger.Job.Interval]
            INTERVAL_WEEK: _ClassVar[Trigger.Job.Interval]
            INTERVAL_MONTH: _ClassVar[Trigger.Job.Interval]
        INTERVAL_UNSPECIFIED: Trigger.Job.Interval
        INTERVAL_MINUTE: Trigger.Job.Interval
        INTERVAL_HOUR: Trigger.Job.Interval
        INTERVAL_DAY: Trigger.Job.Interval
        INTERVAL_WEEK: Trigger.Job.Interval
        INTERVAL_MONTH: Trigger.Job.Interval
        class Options(_message.Message):
            __slots__ = ("profiles", "send_email_on_failure", "deployedCommitId")
            PROFILES_FIELD_NUMBER: _ClassVar[int]
            SEND_EMAIL_ON_FAILURE_FIELD_NUMBER: _ClassVar[int]
            DEPLOYEDCOMMITID_FIELD_NUMBER: _ClassVar[int]
            profiles: Profiles
            send_email_on_failure: bool
            deployedCommitId: str
            def __init__(self, profiles: _Optional[_Union[Profiles, _Mapping]] = ..., send_email_on_failure: bool = ..., deployedCommitId: _Optional[str] = ...) -> None: ...
        class Days(_message.Message):
            __slots__ = ("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday")
            SUNDAY_FIELD_NUMBER: _ClassVar[int]
            MONDAY_FIELD_NUMBER: _ClassVar[int]
            TUESDAY_FIELD_NUMBER: _ClassVar[int]
            WEDNESDAY_FIELD_NUMBER: _ClassVar[int]
            THURSDAY_FIELD_NUMBER: _ClassVar[int]
            FRIDAY_FIELD_NUMBER: _ClassVar[int]
            SATURDAY_FIELD_NUMBER: _ClassVar[int]
            sunday: bool
            monday: bool
            tuesday: bool
            wednesday: bool
            thursday: bool
            friday: bool
            saturday: bool
            def __init__(self, sunday: bool = ..., monday: bool = ..., tuesday: bool = ..., wednesday: bool = ..., thursday: bool = ..., friday: bool = ..., saturday: bool = ...) -> None: ...
        OPTIONS_FIELD_NUMBER: _ClassVar[int]
        FREQUENCY_FIELD_NUMBER: _ClassVar[int]
        INTERVAL_FIELD_NUMBER: _ClassVar[int]
        DAY_OF_MONTH_FIELD_NUMBER: _ClassVar[int]
        DAYS_FIELD_NUMBER: _ClassVar[int]
        TIME_FIELD_NUMBER: _ClassVar[int]
        TIMEZONE_LOCALE_FIELD_NUMBER: _ClassVar[int]
        options: Trigger.Job.Options
        frequency: int
        interval: Trigger.Job.Interval
        day_of_month: int
        days: Trigger.Job.Days
        time: _timestamp_pb2.Timestamp
        timezone_locale: str
        def __init__(self, options: _Optional[_Union[Trigger.Job.Options, _Mapping]] = ..., frequency: _Optional[int] = ..., interval: _Optional[_Union[Trigger.Job.Interval, str]] = ..., day_of_month: _Optional[int] = ..., days: _Optional[_Union[Trigger.Job.Days, _Mapping]] = ..., time: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., timezone_locale: _Optional[str] = ...) -> None: ...
    APPLICATION_FIELD_NUMBER: _ClassVar[int]
    WORKFLOW_FIELD_NUMBER: _ClassVar[int]
    JOB_FIELD_NUMBER: _ClassVar[int]
    application: Trigger.Application
    workflow: Trigger.Workflow
    job: Trigger.Job
    def __init__(self, application: _Optional[_Union[Trigger.Application, _Mapping]] = ..., workflow: _Optional[_Union[Trigger.Workflow, _Mapping]] = ..., job: _Optional[_Union[Trigger.Job, _Mapping]] = ...) -> None: ...

class Blocks(_message.Message):
    __slots__ = ("blocks",)
    BLOCKS_FIELD_NUMBER: _ClassVar[int]
    blocks: _containers.RepeatedCompositeFieldContainer[Block]
    def __init__(self, blocks: _Optional[_Iterable[_Union[Block, _Mapping]]] = ...) -> None: ...

class Block(_message.Message):
    __slots__ = ("name", "wait", "parallel", "conditional", "loop", "try_catch", "step", "variables", "throw", "stream", "send")
    class Parallel(_message.Message):
        __slots__ = ("static", "dynamic", "wait", "pool_size")
        class Wait(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            WAIT_UNSPECIFIED: _ClassVar[Block.Parallel.Wait]
            WAIT_ALL: _ClassVar[Block.Parallel.Wait]
            WAIT_NONE: _ClassVar[Block.Parallel.Wait]
        WAIT_UNSPECIFIED: Block.Parallel.Wait
        WAIT_ALL: Block.Parallel.Wait
        WAIT_NONE: Block.Parallel.Wait
        class Static(_message.Message):
            __slots__ = ("paths",)
            class PathsEntry(_message.Message):
                __slots__ = ("key", "value")
                KEY_FIELD_NUMBER: _ClassVar[int]
                VALUE_FIELD_NUMBER: _ClassVar[int]
                key: str
                value: Blocks
                def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Blocks, _Mapping]] = ...) -> None: ...
            PATHS_FIELD_NUMBER: _ClassVar[int]
            paths: _containers.MessageMap[str, Blocks]
            def __init__(self, paths: _Optional[_Mapping[str, Blocks]] = ...) -> None: ...
        class Dynamic(_message.Message):
            __slots__ = ("paths", "variables", "blocks")
            class Variables(_message.Message):
                __slots__ = ("item",)
                ITEM_FIELD_NUMBER: _ClassVar[int]
                item: str
                def __init__(self, item: _Optional[str] = ...) -> None: ...
            PATHS_FIELD_NUMBER: _ClassVar[int]
            VARIABLES_FIELD_NUMBER: _ClassVar[int]
            BLOCKS_FIELD_NUMBER: _ClassVar[int]
            paths: str
            variables: Block.Parallel.Dynamic.Variables
            blocks: _containers.RepeatedCompositeFieldContainer[Block]
            def __init__(self, paths: _Optional[str] = ..., variables: _Optional[_Union[Block.Parallel.Dynamic.Variables, _Mapping]] = ..., blocks: _Optional[_Iterable[_Union[Block, _Mapping]]] = ...) -> None: ...
        STATIC_FIELD_NUMBER: _ClassVar[int]
        DYNAMIC_FIELD_NUMBER: _ClassVar[int]
        WAIT_FIELD_NUMBER: _ClassVar[int]
        POOL_SIZE_FIELD_NUMBER: _ClassVar[int]
        static: Block.Parallel.Static
        dynamic: Block.Parallel.Dynamic
        wait: Block.Parallel.Wait
        pool_size: int
        def __init__(self, static: _Optional[_Union[Block.Parallel.Static, _Mapping]] = ..., dynamic: _Optional[_Union[Block.Parallel.Dynamic, _Mapping]] = ..., wait: _Optional[_Union[Block.Parallel.Wait, str]] = ..., pool_size: _Optional[int] = ...) -> None: ...
    class Conditional(_message.Message):
        __slots__ = ("else_if",)
        class Condition(_message.Message):
            __slots__ = ("condition", "blocks")
            CONDITION_FIELD_NUMBER: _ClassVar[int]
            BLOCKS_FIELD_NUMBER: _ClassVar[int]
            condition: str
            blocks: _containers.RepeatedCompositeFieldContainer[Block]
            def __init__(self, condition: _Optional[str] = ..., blocks: _Optional[_Iterable[_Union[Block, _Mapping]]] = ...) -> None: ...
        IF_FIELD_NUMBER: _ClassVar[int]
        ELSE_IF_FIELD_NUMBER: _ClassVar[int]
        ELSE_FIELD_NUMBER: _ClassVar[int]
        else_if: _containers.RepeatedCompositeFieldContainer[Block.Conditional.Condition]
        def __init__(self, else_if: _Optional[_Iterable[_Union[Block.Conditional.Condition, _Mapping]]] = ..., **kwargs) -> None: ...
    class Loop(_message.Message):
        __slots__ = ("range", "type", "variables", "blocks")
        class Type(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            TYPE_UNSPECIFIED: _ClassVar[Block.Loop.Type]
            TYPE_FOR: _ClassVar[Block.Loop.Type]
            TYPE_FOREACH: _ClassVar[Block.Loop.Type]
            TYPE_WHILE: _ClassVar[Block.Loop.Type]
        TYPE_UNSPECIFIED: Block.Loop.Type
        TYPE_FOR: Block.Loop.Type
        TYPE_FOREACH: Block.Loop.Type
        TYPE_WHILE: Block.Loop.Type
        class Variables(_message.Message):
            __slots__ = ("index", "item")
            INDEX_FIELD_NUMBER: _ClassVar[int]
            ITEM_FIELD_NUMBER: _ClassVar[int]
            index: str
            item: str
            def __init__(self, index: _Optional[str] = ..., item: _Optional[str] = ...) -> None: ...
        RANGE_FIELD_NUMBER: _ClassVar[int]
        TYPE_FIELD_NUMBER: _ClassVar[int]
        VARIABLES_FIELD_NUMBER: _ClassVar[int]
        BLOCKS_FIELD_NUMBER: _ClassVar[int]
        range: str
        type: Block.Loop.Type
        variables: Block.Loop.Variables
        blocks: _containers.RepeatedCompositeFieldContainer[Block]
        def __init__(self, range: _Optional[str] = ..., type: _Optional[_Union[Block.Loop.Type, str]] = ..., variables: _Optional[_Union[Block.Loop.Variables, _Mapping]] = ..., blocks: _Optional[_Iterable[_Union[Block, _Mapping]]] = ...) -> None: ...
    class TryCatch(_message.Message):
        __slots__ = ("catch", "variables")
        class Variables(_message.Message):
            __slots__ = ("error",)
            ERROR_FIELD_NUMBER: _ClassVar[int]
            error: str
            def __init__(self, error: _Optional[str] = ...) -> None: ...
        TRY_FIELD_NUMBER: _ClassVar[int]
        CATCH_FIELD_NUMBER: _ClassVar[int]
        FINALLY_FIELD_NUMBER: _ClassVar[int]
        VARIABLES_FIELD_NUMBER: _ClassVar[int]
        catch: Blocks
        variables: Block.TryCatch.Variables
        def __init__(self, catch: _Optional[_Union[Blocks, _Mapping]] = ..., variables: _Optional[_Union[Block.TryCatch.Variables, _Mapping]] = ..., **kwargs) -> None: ...
    class Break(_message.Message):
        __slots__ = ("condition",)
        CONDITION_FIELD_NUMBER: _ClassVar[int]
        condition: str
        def __init__(self, condition: _Optional[str] = ...) -> None: ...
    class Return(_message.Message):
        __slots__ = ("data",)
        DATA_FIELD_NUMBER: _ClassVar[int]
        data: str
        def __init__(self, data: _Optional[str] = ...) -> None: ...
    class Throw(_message.Message):
        __slots__ = ("error",)
        ERROR_FIELD_NUMBER: _ClassVar[int]
        error: str
        def __init__(self, error: _Optional[str] = ...) -> None: ...
    class Wait(_message.Message):
        __slots__ = ("condition",)
        CONDITION_FIELD_NUMBER: _ClassVar[int]
        condition: str
        def __init__(self, condition: _Optional[str] = ...) -> None: ...
    class Stream(_message.Message):
        __slots__ = ("trigger", "process", "variables", "options")
        class Variables(_message.Message):
            __slots__ = ("item",)
            ITEM_FIELD_NUMBER: _ClassVar[int]
            item: str
            def __init__(self, item: _Optional[str] = ...) -> None: ...
        class Options(_message.Message):
            __slots__ = ("disable_auto_send",)
            DISABLE_AUTO_SEND_FIELD_NUMBER: _ClassVar[int]
            disable_auto_send: bool
            def __init__(self, disable_auto_send: bool = ...) -> None: ...
        class Trigger(_message.Message):
            __slots__ = ("name", "step")
            NAME_FIELD_NUMBER: _ClassVar[int]
            STEP_FIELD_NUMBER: _ClassVar[int]
            name: str
            step: Step
            def __init__(self, name: _Optional[str] = ..., step: _Optional[_Union[Step, _Mapping]] = ...) -> None: ...
        TRIGGER_FIELD_NUMBER: _ClassVar[int]
        PROCESS_FIELD_NUMBER: _ClassVar[int]
        VARIABLES_FIELD_NUMBER: _ClassVar[int]
        OPTIONS_FIELD_NUMBER: _ClassVar[int]
        trigger: Block.Stream.Trigger
        process: Blocks
        variables: Block.Stream.Variables
        options: Block.Stream.Options
        def __init__(self, trigger: _Optional[_Union[Block.Stream.Trigger, _Mapping]] = ..., process: _Optional[_Union[Blocks, _Mapping]] = ..., variables: _Optional[_Union[Block.Stream.Variables, _Mapping]] = ..., options: _Optional[_Union[Block.Stream.Options, _Mapping]] = ...) -> None: ...
    class Send(_message.Message):
        __slots__ = ("message",)
        MESSAGE_FIELD_NUMBER: _ClassVar[int]
        message: str
        def __init__(self, message: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    BREAK_FIELD_NUMBER: _ClassVar[int]
    RETURN_FIELD_NUMBER: _ClassVar[int]
    WAIT_FIELD_NUMBER: _ClassVar[int]
    PARALLEL_FIELD_NUMBER: _ClassVar[int]
    CONDITIONAL_FIELD_NUMBER: _ClassVar[int]
    LOOP_FIELD_NUMBER: _ClassVar[int]
    TRY_CATCH_FIELD_NUMBER: _ClassVar[int]
    STEP_FIELD_NUMBER: _ClassVar[int]
    VARIABLES_FIELD_NUMBER: _ClassVar[int]
    THROW_FIELD_NUMBER: _ClassVar[int]
    STREAM_FIELD_NUMBER: _ClassVar[int]
    SEND_FIELD_NUMBER: _ClassVar[int]
    name: str
    wait: Block.Wait
    parallel: Block.Parallel
    conditional: Block.Conditional
    loop: Block.Loop
    try_catch: Block.TryCatch
    step: Step
    variables: _blocks_pb2.Variables
    throw: Block.Throw
    stream: Block.Stream
    send: Block.Send
    def __init__(self, name: _Optional[str] = ..., wait: _Optional[_Union[Block.Wait, _Mapping]] = ..., parallel: _Optional[_Union[Block.Parallel, _Mapping]] = ..., conditional: _Optional[_Union[Block.Conditional, _Mapping]] = ..., loop: _Optional[_Union[Block.Loop, _Mapping]] = ..., try_catch: _Optional[_Union[Block.TryCatch, _Mapping]] = ..., step: _Optional[_Union[Step, _Mapping]] = ..., variables: _Optional[_Union[_blocks_pb2.Variables, _Mapping]] = ..., throw: _Optional[_Union[Block.Throw, _Mapping]] = ..., stream: _Optional[_Union[Block.Stream, _Mapping]] = ..., send: _Optional[_Union[Block.Send, _Mapping]] = ..., **kwargs) -> None: ...

class Step(_message.Message):
    __slots__ = ("integration", "python", "bigquery", "dynamodb", "email", "graphql", "graphqlintegration", "gsheets", "mariadb", "mssql", "mysql", "postgres", "redshift", "restapi", "restapiintegration", "rockset", "s3", "snowflake", "workflow", "javascript", "mongodb", "gcs", "openai", "ocr", "kafka", "confluent", "msk", "redpanda", "aivenkafka", "cockroachdb", "airtable", "notion", "pagerduty", "sendgrid", "slack", "athena", "redis", "asana", "github", "smtp", "salesforce", "bitbucket", "circleci", "front", "intercom", "segment", "launchdarkly", "dropbox", "twilio", "googledrive", "googleanalytics", "box", "hubspot", "stripe", "zoom", "jira", "zendesk", "adls", "pinecone", "cosmosdb", "datadog", "xero", "oracledb", "elasticsearch", "databricks", "couchbase", "custom", "anthropic", "cohere", "fireworks", "mistral", "groq", "perplexity", "stabilityai", "gemini", "kinesis", "confluence", "openai_v2", "lakebase")
    INTEGRATION_FIELD_NUMBER: _ClassVar[int]
    PYTHON_FIELD_NUMBER: _ClassVar[int]
    BIGQUERY_FIELD_NUMBER: _ClassVar[int]
    DYNAMODB_FIELD_NUMBER: _ClassVar[int]
    EMAIL_FIELD_NUMBER: _ClassVar[int]
    GRAPHQL_FIELD_NUMBER: _ClassVar[int]
    GRAPHQLINTEGRATION_FIELD_NUMBER: _ClassVar[int]
    GSHEETS_FIELD_NUMBER: _ClassVar[int]
    MARIADB_FIELD_NUMBER: _ClassVar[int]
    MSSQL_FIELD_NUMBER: _ClassVar[int]
    MYSQL_FIELD_NUMBER: _ClassVar[int]
    POSTGRES_FIELD_NUMBER: _ClassVar[int]
    REDSHIFT_FIELD_NUMBER: _ClassVar[int]
    RESTAPI_FIELD_NUMBER: _ClassVar[int]
    RESTAPIINTEGRATION_FIELD_NUMBER: _ClassVar[int]
    ROCKSET_FIELD_NUMBER: _ClassVar[int]
    S3_FIELD_NUMBER: _ClassVar[int]
    SNOWFLAKE_FIELD_NUMBER: _ClassVar[int]
    WORKFLOW_FIELD_NUMBER: _ClassVar[int]
    JAVASCRIPT_FIELD_NUMBER: _ClassVar[int]
    MONGODB_FIELD_NUMBER: _ClassVar[int]
    GCS_FIELD_NUMBER: _ClassVar[int]
    OPENAI_FIELD_NUMBER: _ClassVar[int]
    OCR_FIELD_NUMBER: _ClassVar[int]
    KAFKA_FIELD_NUMBER: _ClassVar[int]
    CONFLUENT_FIELD_NUMBER: _ClassVar[int]
    MSK_FIELD_NUMBER: _ClassVar[int]
    REDPANDA_FIELD_NUMBER: _ClassVar[int]
    AIVENKAFKA_FIELD_NUMBER: _ClassVar[int]
    COCKROACHDB_FIELD_NUMBER: _ClassVar[int]
    AIRTABLE_FIELD_NUMBER: _ClassVar[int]
    NOTION_FIELD_NUMBER: _ClassVar[int]
    PAGERDUTY_FIELD_NUMBER: _ClassVar[int]
    SENDGRID_FIELD_NUMBER: _ClassVar[int]
    SLACK_FIELD_NUMBER: _ClassVar[int]
    ATHENA_FIELD_NUMBER: _ClassVar[int]
    REDIS_FIELD_NUMBER: _ClassVar[int]
    ASANA_FIELD_NUMBER: _ClassVar[int]
    GITHUB_FIELD_NUMBER: _ClassVar[int]
    SMTP_FIELD_NUMBER: _ClassVar[int]
    SALESFORCE_FIELD_NUMBER: _ClassVar[int]
    BITBUCKET_FIELD_NUMBER: _ClassVar[int]
    CIRCLECI_FIELD_NUMBER: _ClassVar[int]
    FRONT_FIELD_NUMBER: _ClassVar[int]
    INTERCOM_FIELD_NUMBER: _ClassVar[int]
    SEGMENT_FIELD_NUMBER: _ClassVar[int]
    LAUNCHDARKLY_FIELD_NUMBER: _ClassVar[int]
    DROPBOX_FIELD_NUMBER: _ClassVar[int]
    TWILIO_FIELD_NUMBER: _ClassVar[int]
    GOOGLEDRIVE_FIELD_NUMBER: _ClassVar[int]
    GOOGLEANALYTICS_FIELD_NUMBER: _ClassVar[int]
    BOX_FIELD_NUMBER: _ClassVar[int]
    HUBSPOT_FIELD_NUMBER: _ClassVar[int]
    STRIPE_FIELD_NUMBER: _ClassVar[int]
    ZOOM_FIELD_NUMBER: _ClassVar[int]
    JIRA_FIELD_NUMBER: _ClassVar[int]
    ZENDESK_FIELD_NUMBER: _ClassVar[int]
    ADLS_FIELD_NUMBER: _ClassVar[int]
    PINECONE_FIELD_NUMBER: _ClassVar[int]
    COSMOSDB_FIELD_NUMBER: _ClassVar[int]
    DATADOG_FIELD_NUMBER: _ClassVar[int]
    XERO_FIELD_NUMBER: _ClassVar[int]
    ORACLEDB_FIELD_NUMBER: _ClassVar[int]
    ELASTICSEARCH_FIELD_NUMBER: _ClassVar[int]
    DATABRICKS_FIELD_NUMBER: _ClassVar[int]
    COUCHBASE_FIELD_NUMBER: _ClassVar[int]
    CUSTOM_FIELD_NUMBER: _ClassVar[int]
    ANTHROPIC_FIELD_NUMBER: _ClassVar[int]
    COHERE_FIELD_NUMBER: _ClassVar[int]
    FIREWORKS_FIELD_NUMBER: _ClassVar[int]
    MISTRAL_FIELD_NUMBER: _ClassVar[int]
    GROQ_FIELD_NUMBER: _ClassVar[int]
    PERPLEXITY_FIELD_NUMBER: _ClassVar[int]
    STABILITYAI_FIELD_NUMBER: _ClassVar[int]
    GEMINI_FIELD_NUMBER: _ClassVar[int]
    KINESIS_FIELD_NUMBER: _ClassVar[int]
    CONFLUENCE_FIELD_NUMBER: _ClassVar[int]
    OPENAI_V2_FIELD_NUMBER: _ClassVar[int]
    LAKEBASE_FIELD_NUMBER: _ClassVar[int]
    integration: str
    python: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    bigquery: _plugin_pb2_1_1.Plugin
    dynamodb: _plugin_pb2_1_1_1_1_1_1_1_1.Plugin
    email: _plugin_pb2_1_1_1_1_1_1_1_1_1.Plugin
    graphql: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1.Plugin
    graphqlintegration: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1.Plugin
    gsheets: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    mariadb: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    mssql: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    mysql: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    postgres: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    redshift: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    restapi: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    restapiintegration: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    rockset: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    s3: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    snowflake: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    workflow: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    javascript: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    mongodb: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    gcs: _plugin_pb2_1_1_1_1_1_1_1_1_1_1.Plugin
    openai: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    ocr: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    kafka: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    confluent: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    msk: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    redpanda: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    aivenkafka: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    cockroachdb: _plugin_pb2_1_1_1.Plugin
    airtable: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    notion: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    pagerduty: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    sendgrid: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    slack: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    athena: _plugin_pb2_1.Plugin
    redis: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    asana: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    github: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    smtp: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    salesforce: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    bitbucket: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    circleci: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    front: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    intercom: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    segment: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    launchdarkly: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    dropbox: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    twilio: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    googledrive: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    googleanalytics: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    box: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    hubspot: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    stripe: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    zoom: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    jira: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    zendesk: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    adls: _plugin_pb2.Plugin
    pinecone: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    cosmosdb: _plugin_pb2_1_1_1_1.Plugin
    datadog: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    xero: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    oracledb: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    elasticsearch: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    databricks: _plugin_pb2_1_1_1_1_1_1_1.Plugin
    couchbase: _plugin_pb2_1_1_1_1_1.Plugin
    custom: _plugin_pb2_1_1_1_1_1_1.Plugin
    anthropic: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    cohere: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    fireworks: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    mistral: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    groq: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    perplexity: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    stabilityai: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    gemini: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    kinesis: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    confluence: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    openai_v2: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    lakebase: _plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin
    def __init__(self, integration: _Optional[str] = ..., python: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., bigquery: _Optional[_Union[_plugin_pb2_1_1.Plugin, _Mapping]] = ..., dynamodb: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., email: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., graphql: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., graphqlintegration: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., gsheets: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., mariadb: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., mssql: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., mysql: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., postgres: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., redshift: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., restapi: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., restapiintegration: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., rockset: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., s3: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., snowflake: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., workflow: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., javascript: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., mongodb: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., gcs: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., openai: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., ocr: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., kafka: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., confluent: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., msk: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., redpanda: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., aivenkafka: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., cockroachdb: _Optional[_Union[_plugin_pb2_1_1_1.Plugin, _Mapping]] = ..., airtable: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., notion: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., pagerduty: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., sendgrid: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., slack: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., athena: _Optional[_Union[_plugin_pb2_1.Plugin, _Mapping]] = ..., redis: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., asana: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., github: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., smtp: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., salesforce: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., bitbucket: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., circleci: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., front: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., intercom: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., segment: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., launchdarkly: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., dropbox: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., twilio: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., googledrive: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., googleanalytics: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., box: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., hubspot: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., stripe: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., zoom: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., jira: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., zendesk: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., adls: _Optional[_Union[_plugin_pb2.Plugin, _Mapping]] = ..., pinecone: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., cosmosdb: _Optional[_Union[_plugin_pb2_1_1_1_1.Plugin, _Mapping]] = ..., datadog: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., xero: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., oracledb: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., elasticsearch: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., databricks: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., couchbase: _Optional[_Union[_plugin_pb2_1_1_1_1_1.Plugin, _Mapping]] = ..., custom: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1.Plugin, _Mapping]] = ..., anthropic: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., cohere: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., fireworks: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., mistral: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., groq: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., perplexity: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., stabilityai: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., gemini: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., kinesis: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., confluence: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., openai_v2: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ..., lakebase: _Optional[_Union[_plugin_pb2_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1_1.Plugin, _Mapping]] = ...) -> None: ...
