from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import language_pb2 as _language_pb2
from common.v1 import utils_pb2 as _utils_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class LLM(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    LLM_UNSPECIFIED: _ClassVar[LLM]
    LLM_OPENAI: _ClassVar[LLM]
    LLM_ANTHROPIC: _ClassVar[LLM]
    LLM_MOCK: _ClassVar[LLM]

class MODEL(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    MODEL_UNSPECIFIED: _ClassVar[MODEL]
    MODEL_ANTHROPIC_CLAUDE_V1: _ClassVar[MODEL]
    MODEL_ANTHROPIC_CLAUDE_V1_0: _ClassVar[MODEL]
    MODEL_ANTHROPIC_CLAUDE_V1_2: _ClassVar[MODEL]
    MODEL_ANTHROPIC_CLAUDE_INSTANT_V1: _ClassVar[MODEL]
    MODEL_ANTHROPIC_CLAUDE_INSTANT_V1_0: _ClassVar[MODEL]
    MODEL_OPENAI_GPT432K0314: _ClassVar[MODEL]
    MODEL_OPENAI_GPT432K0613: _ClassVar[MODEL]
    MODEL_OPENAI_GPT432K: _ClassVar[MODEL]
    MODEL_OPENAI_GPT40314: _ClassVar[MODEL]
    MODEL_OPENAI_GPT40613: _ClassVar[MODEL]
    MODEL_OPENAI_GPT4: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_5_TURBO_0301: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_5_TURBO_0613: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_5_TURBO: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_5_TURBO_16K: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_5_TURBO_16K_0613: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_003: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_002: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_TEXT_CURIE_001: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_TEXT_BAGGAGE_001: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_TEXT_ADA_001: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_TEXT_DAVINCI_001: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_DAVINCI_INSTRUCT_BETA: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_DAVINCI: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_CURIE_INSTRUCT_BETA: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_CURIE: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_ADA: _ClassVar[MODEL]
    MODEL_OPENAI_GPT3_BAGGAGE: _ClassVar[MODEL]
    MODEL_MOCK_TIER_ONE: _ClassVar[MODEL]
    MODEL_MOCK_TIER_TWO: _ClassVar[MODEL]

class Role(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    ROLE_UNSPECIFIED: _ClassVar[Role]
    ROLE_USER: _ClassVar[Role]
    ROLE_ASSISTANT: _ClassVar[Role]
    ROLE_SYSTEM: _ClassVar[Role]

class Syntax(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SYNTAX_UNSPECIFIED: _ClassVar[Syntax]
    SYNTAX_JAVASCRIPT: _ClassVar[Syntax]
    SYNTAX_PYTHON: _ClassVar[Syntax]
    SYNTAX_POSTGRESQL: _ClassVar[Syntax]
    SYNTAX_MSSQL: _ClassVar[Syntax]
    SYNTAX_MYSQL: _ClassVar[Syntax]
    SYNTAX_MARIADB: _ClassVar[Syntax]
    SYNTAX_SNOWFLAKE: _ClassVar[Syntax]
    SYNTAX_COCKROACHDB: _ClassVar[Syntax]
    SYNTAX_ROCKSET: _ClassVar[Syntax]
    SYNTAX_REDSHIFT: _ClassVar[Syntax]
    SYNTAX_BIGQUERY: _ClassVar[Syntax]
    SYNTAX_DYNAMODB: _ClassVar[Syntax]
    SYNTAX_MONGODB: _ClassVar[Syntax]
    SYNTAX_BINDING: _ClassVar[Syntax]
    SYNTAX_JSON: _ClassVar[Syntax]
    SYNTAX_HTML: _ClassVar[Syntax]
    SYNTAX_API: _ClassVar[Syntax]
    SYNTAX_PLUGIN_RESTAPI: _ClassVar[Syntax]
    SYNTAX_PLUGIN_GRAPHQL: _ClassVar[Syntax]
    SYNTAX_ORACLEDB: _ClassVar[Syntax]
    SYNTAX_DATABRICKS: _ClassVar[Syntax]

class Persona(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    PERSONA_UNSPECIFIED: _ClassVar[Persona]
    PERSONA_DEVELOPER: _ClassVar[Persona]
    PERSONA_TEACHER: _ClassVar[Persona]
LLM_UNSPECIFIED: LLM
LLM_OPENAI: LLM
LLM_ANTHROPIC: LLM
LLM_MOCK: LLM
MODEL_UNSPECIFIED: MODEL
MODEL_ANTHROPIC_CLAUDE_V1: MODEL
MODEL_ANTHROPIC_CLAUDE_V1_0: MODEL
MODEL_ANTHROPIC_CLAUDE_V1_2: MODEL
MODEL_ANTHROPIC_CLAUDE_INSTANT_V1: MODEL
MODEL_ANTHROPIC_CLAUDE_INSTANT_V1_0: MODEL
MODEL_OPENAI_GPT432K0314: MODEL
MODEL_OPENAI_GPT432K0613: MODEL
MODEL_OPENAI_GPT432K: MODEL
MODEL_OPENAI_GPT40314: MODEL
MODEL_OPENAI_GPT40613: MODEL
MODEL_OPENAI_GPT4: MODEL
MODEL_OPENAI_GPT3_5_TURBO_0301: MODEL
MODEL_OPENAI_GPT3_5_TURBO_0613: MODEL
MODEL_OPENAI_GPT3_5_TURBO: MODEL
MODEL_OPENAI_GPT3_5_TURBO_16K: MODEL
MODEL_OPENAI_GPT3_5_TURBO_16K_0613: MODEL
MODEL_OPENAI_GPT3_TEXT_DAVINCI_003: MODEL
MODEL_OPENAI_GPT3_TEXT_DAVINCI_002: MODEL
MODEL_OPENAI_GPT3_TEXT_CURIE_001: MODEL
MODEL_OPENAI_GPT3_TEXT_BAGGAGE_001: MODEL
MODEL_OPENAI_GPT3_TEXT_ADA_001: MODEL
MODEL_OPENAI_GPT3_TEXT_DAVINCI_001: MODEL
MODEL_OPENAI_GPT3_DAVINCI_INSTRUCT_BETA: MODEL
MODEL_OPENAI_GPT3_DAVINCI: MODEL
MODEL_OPENAI_GPT3_CURIE_INSTRUCT_BETA: MODEL
MODEL_OPENAI_GPT3_CURIE: MODEL
MODEL_OPENAI_GPT3_ADA: MODEL
MODEL_OPENAI_GPT3_BAGGAGE: MODEL
MODEL_MOCK_TIER_ONE: MODEL
MODEL_MOCK_TIER_TWO: MODEL
ROLE_UNSPECIFIED: Role
ROLE_USER: Role
ROLE_ASSISTANT: Role
ROLE_SYSTEM: Role
SYNTAX_UNSPECIFIED: Syntax
SYNTAX_JAVASCRIPT: Syntax
SYNTAX_PYTHON: Syntax
SYNTAX_POSTGRESQL: Syntax
SYNTAX_MSSQL: Syntax
SYNTAX_MYSQL: Syntax
SYNTAX_MARIADB: Syntax
SYNTAX_SNOWFLAKE: Syntax
SYNTAX_COCKROACHDB: Syntax
SYNTAX_ROCKSET: Syntax
SYNTAX_REDSHIFT: Syntax
SYNTAX_BIGQUERY: Syntax
SYNTAX_DYNAMODB: Syntax
SYNTAX_MONGODB: Syntax
SYNTAX_BINDING: Syntax
SYNTAX_JSON: Syntax
SYNTAX_HTML: Syntax
SYNTAX_API: Syntax
SYNTAX_PLUGIN_RESTAPI: Syntax
SYNTAX_PLUGIN_GRAPHQL: Syntax
SYNTAX_ORACLEDB: Syntax
SYNTAX_DATABRICKS: Syntax
PERSONA_UNSPECIFIED: Persona
PERSONA_DEVELOPER: Persona
PERSONA_TEACHER: Persona

class Message(_message.Message):
    __slots__ = ("role", "content")
    ROLE_FIELD_NUMBER: _ClassVar[int]
    CONTENT_FIELD_NUMBER: _ClassVar[int]
    role: Role
    content: str
    def __init__(self, role: _Optional[_Union[Role, str]] = ..., content: _Optional[str] = ...) -> None: ...

class Task(_message.Message):
    __slots__ = ("optimize", "edit", "explain", "create", "debug", "transpile", "mock", "history")
    class Optimize(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    class Debug(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    class Transpile(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    class Edit(_message.Message):
        __slots__ = ("prompt", "syntax", "snippet", "context")
        class Context(_message.Message):
            __slots__ = ("metadata", "configuration_ids")
            METADATA_FIELD_NUMBER: _ClassVar[int]
            CONFIGURATION_IDS_FIELD_NUMBER: _ClassVar[int]
            metadata: _struct_pb2.Struct
            configuration_ids: _utils_pb2.StringList
            def __init__(self, metadata: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., configuration_ids: _Optional[_Union[_utils_pb2.StringList, _Mapping]] = ...) -> None: ...
        PROMPT_FIELD_NUMBER: _ClassVar[int]
        SYNTAX_FIELD_NUMBER: _ClassVar[int]
        SNIPPET_FIELD_NUMBER: _ClassVar[int]
        CONTEXT_FIELD_NUMBER: _ClassVar[int]
        prompt: str
        syntax: Syntax
        snippet: str
        context: Task.Edit.Context
        def __init__(self, prompt: _Optional[str] = ..., syntax: _Optional[_Union[Syntax, str]] = ..., snippet: _Optional[str] = ..., context: _Optional[_Union[Task.Edit.Context, _Mapping]] = ...) -> None: ...
    class Create(_message.Message):
        __slots__ = ("prompt", "syntax", "context")
        class Context(_message.Message):
            __slots__ = ("metadata", "configuration_ids")
            METADATA_FIELD_NUMBER: _ClassVar[int]
            CONFIGURATION_IDS_FIELD_NUMBER: _ClassVar[int]
            metadata: _struct_pb2.Struct
            configuration_ids: _utils_pb2.StringList
            def __init__(self, metadata: _Optional[_Union[_struct_pb2.Struct, _Mapping]] = ..., configuration_ids: _Optional[_Union[_utils_pb2.StringList, _Mapping]] = ...) -> None: ...
        PROMPT_FIELD_NUMBER: _ClassVar[int]
        SYNTAX_FIELD_NUMBER: _ClassVar[int]
        CONTEXT_FIELD_NUMBER: _ClassVar[int]
        prompt: str
        syntax: Syntax
        context: Task.Create.Context
        def __init__(self, prompt: _Optional[str] = ..., syntax: _Optional[_Union[Syntax, str]] = ..., context: _Optional[_Union[Task.Create.Context, _Mapping]] = ...) -> None: ...
    class Explain(_message.Message):
        __slots__ = ("syntax", "snippet", "contents", "language")
        SYNTAX_FIELD_NUMBER: _ClassVar[int]
        SNIPPET_FIELD_NUMBER: _ClassVar[int]
        CONTENTS_FIELD_NUMBER: _ClassVar[int]
        LANGUAGE_FIELD_NUMBER: _ClassVar[int]
        syntax: Syntax
        snippet: str
        contents: str
        language: _language_pb2.Language
        def __init__(self, syntax: _Optional[_Union[Syntax, str]] = ..., snippet: _Optional[str] = ..., contents: _Optional[str] = ..., language: _Optional[_Union[_language_pb2.Language, str]] = ...) -> None: ...
    class Mock(_message.Message):
        __slots__ = ("syntax", "shape", "prompt")
        SYNTAX_FIELD_NUMBER: _ClassVar[int]
        SHAPE_FIELD_NUMBER: _ClassVar[int]
        PROMPT_FIELD_NUMBER: _ClassVar[int]
        syntax: Syntax
        shape: str
        prompt: str
        def __init__(self, syntax: _Optional[_Union[Syntax, str]] = ..., shape: _Optional[str] = ..., prompt: _Optional[str] = ...) -> None: ...
    OPTIMIZE_FIELD_NUMBER: _ClassVar[int]
    EDIT_FIELD_NUMBER: _ClassVar[int]
    EXPLAIN_FIELD_NUMBER: _ClassVar[int]
    CREATE_FIELD_NUMBER: _ClassVar[int]
    DEBUG_FIELD_NUMBER: _ClassVar[int]
    TRANSPILE_FIELD_NUMBER: _ClassVar[int]
    MOCK_FIELD_NUMBER: _ClassVar[int]
    HISTORY_FIELD_NUMBER: _ClassVar[int]
    optimize: Task.Optimize
    edit: Task.Edit
    explain: Task.Explain
    create: Task.Create
    debug: Task.Debug
    transpile: Task.Transpile
    mock: Task.Mock
    history: _containers.RepeatedCompositeFieldContainer[Message]
    def __init__(self, optimize: _Optional[_Union[Task.Optimize, _Mapping]] = ..., edit: _Optional[_Union[Task.Edit, _Mapping]] = ..., explain: _Optional[_Union[Task.Explain, _Mapping]] = ..., create: _Optional[_Union[Task.Create, _Mapping]] = ..., debug: _Optional[_Union[Task.Debug, _Mapping]] = ..., transpile: _Optional[_Union[Task.Transpile, _Mapping]] = ..., mock: _Optional[_Union[Task.Mock, _Mapping]] = ..., history: _Optional[_Iterable[_Union[Message, _Mapping]]] = ...) -> None: ...
