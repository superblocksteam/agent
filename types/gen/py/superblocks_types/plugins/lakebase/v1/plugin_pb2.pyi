from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
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
    class ConnectionType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        CONNECTION_TYPE_UNSPECIFIED: _ClassVar[Plugin.ConnectionType]
        CONNECTION_TYPE_USERNAME_PASSWORD: _ClassVar[Plugin.ConnectionType]
        CONNECTION_TYPE_OAUTH_M2M: _ClassVar[Plugin.ConnectionType]
        CONNECTION_TYPE_OAUTH_FEDERATION: _ClassVar[Plugin.ConnectionType]
    CONNECTION_TYPE_UNSPECIFIED: Plugin.ConnectionType
    CONNECTION_TYPE_USERNAME_PASSWORD: Plugin.ConnectionType
    CONNECTION_TYPE_OAUTH_M2M: Plugin.ConnectionType
    CONNECTION_TYPE_OAUTH_FEDERATION: Plugin.ConnectionType
    class LakebaseConnection(_message.Message):
        __slots__ = ("host", "port", "database_name", "connection_type", "username", "password", "oauth_client_id", "oauth_client_secret", "oauth_workspace_url")
        HOST_FIELD_NUMBER: _ClassVar[int]
        PORT_FIELD_NUMBER: _ClassVar[int]
        DATABASE_NAME_FIELD_NUMBER: _ClassVar[int]
        CONNECTION_TYPE_FIELD_NUMBER: _ClassVar[int]
        USERNAME_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        OAUTH_CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        OAUTH_CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
        OAUTH_WORKSPACE_URL_FIELD_NUMBER: _ClassVar[int]
        host: str
        port: int
        database_name: str
        connection_type: Plugin.ConnectionType
        username: str
        password: str
        oauth_client_id: str
        oauth_client_secret: str
        oauth_workspace_url: str
        def __init__(self, host: _Optional[str] = ..., port: _Optional[int] = ..., database_name: _Optional[str] = ..., connection_type: _Optional[_Union[Plugin.ConnectionType, str]] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., oauth_client_id: _Optional[str] = ..., oauth_client_secret: _Optional[str] = ..., oauth_workspace_url: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    USEPREPAREDSQL_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.LakebaseConnection
    body: str
    usePreparedSql: bool
    parameters: str
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.LakebaseConnection, _Mapping]] = ..., body: _Optional[str] = ..., usePreparedSql: bool = ..., parameters: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
