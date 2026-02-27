from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "body", "usePreparedSql", "parameters", "superblocksMetadata")
    class SnowflakePostgresConnection(_message.Message):
        __slots__ = ("host", "port", "database_name", "username", "password", "use_self_signed_ssl", "ca", "key", "cert")
        HOST_FIELD_NUMBER: _ClassVar[int]
        PORT_FIELD_NUMBER: _ClassVar[int]
        DATABASE_NAME_FIELD_NUMBER: _ClassVar[int]
        USERNAME_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        USE_SELF_SIGNED_SSL_FIELD_NUMBER: _ClassVar[int]
        CA_FIELD_NUMBER: _ClassVar[int]
        KEY_FIELD_NUMBER: _ClassVar[int]
        CERT_FIELD_NUMBER: _ClassVar[int]
        host: str
        port: int
        database_name: str
        username: str
        password: str
        use_self_signed_ssl: bool
        ca: str
        key: str
        cert: str
        def __init__(self, host: _Optional[str] = ..., port: _Optional[int] = ..., database_name: _Optional[str] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., use_self_signed_ssl: bool = ..., ca: _Optional[str] = ..., key: _Optional[str] = ..., cert: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    USEPREPAREDSQL_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.SnowflakePostgresConnection
    body: str
    usePreparedSql: bool
    parameters: str
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.SnowflakePostgresConnection, _Mapping]] = ..., body: _Optional[str] = ..., usePreparedSql: bool = ..., parameters: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
