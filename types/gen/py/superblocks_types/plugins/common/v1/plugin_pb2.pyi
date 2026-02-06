from buf.validate import validate_pb2 as _validate_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SSHAuthMethod(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SSH_AUTH_METHOD_UNSPECIFIED: _ClassVar[SSHAuthMethod]
    SSH_AUTH_METHOD_PASSWORD: _ClassVar[SSHAuthMethod]
    SSH_AUTH_METHOD_PUB_KEY_RSA: _ClassVar[SSHAuthMethod]
    SSH_AUTH_METHOD_PUB_KEY_ED25519: _ClassVar[SSHAuthMethod]
    SSH_AUTH_METHOD_USER_PRIVATE_KEY: _ClassVar[SSHAuthMethod]

class SQLMappingMode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SQL_MAPPING_MODE_UNSPECIFIED: _ClassVar[SQLMappingMode]
    SQL_MAPPING_MODE_AUTO: _ClassVar[SQLMappingMode]
    SQL_MAPPING_MODE_MANUAL: _ClassVar[SQLMappingMode]

class SQLMatchingMode(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SQL_MATCHING_MODE_UNSPECIFIED: _ClassVar[SQLMatchingMode]
    SQL_MATCHING_MODE_AUTO: _ClassVar[SQLMatchingMode]
    SQL_MATCHING_MODE_ADVANCED: _ClassVar[SQLMatchingMode]

class SQLOperation(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SQL_OPERATION_UNSPECIFIED: _ClassVar[SQLOperation]
    SQL_OPERATION_RUN_SQL: _ClassVar[SQLOperation]
    SQL_OPERATION_UPDATE_ROWS: _ClassVar[SQLOperation]
SSH_AUTH_METHOD_UNSPECIFIED: SSHAuthMethod
SSH_AUTH_METHOD_PASSWORD: SSHAuthMethod
SSH_AUTH_METHOD_PUB_KEY_RSA: SSHAuthMethod
SSH_AUTH_METHOD_PUB_KEY_ED25519: SSHAuthMethod
SSH_AUTH_METHOD_USER_PRIVATE_KEY: SSHAuthMethod
SQL_MAPPING_MODE_UNSPECIFIED: SQLMappingMode
SQL_MAPPING_MODE_AUTO: SQLMappingMode
SQL_MAPPING_MODE_MANUAL: SQLMappingMode
SQL_MATCHING_MODE_UNSPECIFIED: SQLMatchingMode
SQL_MATCHING_MODE_AUTO: SQLMatchingMode
SQL_MATCHING_MODE_ADVANCED: SQLMatchingMode
SQL_OPERATION_UNSPECIFIED: SQLOperation
SQL_OPERATION_RUN_SQL: SQLOperation
SQL_OPERATION_UPDATE_ROWS: SQLOperation

class DynamicWorkflowConfiguration(_message.Message):
    __slots__ = ("enabled", "workflow_id")
    ENABLED_FIELD_NUMBER: _ClassVar[int]
    WORKFLOW_ID_FIELD_NUMBER: _ClassVar[int]
    enabled: bool
    workflow_id: str
    def __init__(self, enabled: bool = ..., workflow_id: _Optional[str] = ...) -> None: ...

class AWSConfig(_message.Message):
    __slots__ = ("region", "auth", "endpoint")
    class Auth(_message.Message):
        __slots__ = ("access_key_id", "secret_key", "iam_role_arn")
        ACCESS_KEY_ID_FIELD_NUMBER: _ClassVar[int]
        SECRET_KEY_FIELD_NUMBER: _ClassVar[int]
        IAM_ROLE_ARN_FIELD_NUMBER: _ClassVar[int]
        access_key_id: str
        secret_key: str
        iam_role_arn: str
        def __init__(self, access_key_id: _Optional[str] = ..., secret_key: _Optional[str] = ..., iam_role_arn: _Optional[str] = ...) -> None: ...
    REGION_FIELD_NUMBER: _ClassVar[int]
    AUTH_FIELD_NUMBER: _ClassVar[int]
    ENDPOINT_FIELD_NUMBER: _ClassVar[int]
    region: str
    auth: AWSConfig.Auth
    endpoint: str
    def __init__(self, region: _Optional[str] = ..., auth: _Optional[_Union[AWSConfig.Auth, _Mapping]] = ..., endpoint: _Optional[str] = ...) -> None: ...

class SQLExecution(_message.Message):
    __slots__ = ("sql_body", "use_parameterized", "parameters")
    SQL_BODY_FIELD_NUMBER: _ClassVar[int]
    USE_PARAMETERIZED_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    sql_body: str
    use_parameterized: bool
    parameters: str
    def __init__(self, sql_body: _Optional[str] = ..., use_parameterized: bool = ..., parameters: _Optional[str] = ...) -> None: ...

class SQLMappedColumns(_message.Message):
    __slots__ = ("json", "sql")
    JSON_FIELD_NUMBER: _ClassVar[int]
    SQL_FIELD_NUMBER: _ClassVar[int]
    json: str
    sql: str
    def __init__(self, json: _Optional[str] = ..., sql: _Optional[str] = ...) -> None: ...

class SSHConfiguration(_message.Message):
    __slots__ = ("authentication_method", "enabled", "host", "passphrase", "password", "port", "private_key", "public_key", "username")
    AUTHENTICATION_METHOD_FIELD_NUMBER: _ClassVar[int]
    ENABLED_FIELD_NUMBER: _ClassVar[int]
    HOST_FIELD_NUMBER: _ClassVar[int]
    PASSPHRASE_FIELD_NUMBER: _ClassVar[int]
    PASSWORD_FIELD_NUMBER: _ClassVar[int]
    PORT_FIELD_NUMBER: _ClassVar[int]
    PRIVATE_KEY_FIELD_NUMBER: _ClassVar[int]
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    authentication_method: SSHAuthMethod
    enabled: bool
    host: str
    passphrase: str
    password: str
    port: int
    private_key: str
    public_key: str
    username: str
    def __init__(self, authentication_method: _Optional[_Union[SSHAuthMethod, str]] = ..., enabled: bool = ..., host: _Optional[str] = ..., passphrase: _Optional[str] = ..., password: _Optional[str] = ..., port: _Optional[int] = ..., private_key: _Optional[str] = ..., public_key: _Optional[str] = ..., username: _Optional[str] = ...) -> None: ...

class SQLBulkEdit(_message.Message):
    __slots__ = ("matching_mode", "schema", "table", "updated_rows", "old_rows", "filter_by", "mapping_mode", "mapped_columns", "inserted_rows", "deleted_rows")
    MATCHING_MODE_FIELD_NUMBER: _ClassVar[int]
    SCHEMA_FIELD_NUMBER: _ClassVar[int]
    TABLE_FIELD_NUMBER: _ClassVar[int]
    UPDATED_ROWS_FIELD_NUMBER: _ClassVar[int]
    OLD_ROWS_FIELD_NUMBER: _ClassVar[int]
    FILTER_BY_FIELD_NUMBER: _ClassVar[int]
    MAPPING_MODE_FIELD_NUMBER: _ClassVar[int]
    MAPPED_COLUMNS_FIELD_NUMBER: _ClassVar[int]
    INSERTED_ROWS_FIELD_NUMBER: _ClassVar[int]
    DELETED_ROWS_FIELD_NUMBER: _ClassVar[int]
    matching_mode: SQLMatchingMode
    schema: str
    table: str
    updated_rows: str
    old_rows: str
    filter_by: _containers.RepeatedScalarFieldContainer[str]
    mapping_mode: SQLMappingMode
    mapped_columns: _containers.RepeatedCompositeFieldContainer[SQLMappedColumns]
    inserted_rows: str
    deleted_rows: str
    def __init__(self, matching_mode: _Optional[_Union[SQLMatchingMode, str]] = ..., schema: _Optional[str] = ..., table: _Optional[str] = ..., updated_rows: _Optional[str] = ..., old_rows: _Optional[str] = ..., filter_by: _Optional[_Iterable[str]] = ..., mapping_mode: _Optional[_Union[SQLMappingMode, str]] = ..., mapped_columns: _Optional[_Iterable[_Union[SQLMappedColumns, _Mapping]]] = ..., inserted_rows: _Optional[str] = ..., deleted_rows: _Optional[str] = ...) -> None: ...
