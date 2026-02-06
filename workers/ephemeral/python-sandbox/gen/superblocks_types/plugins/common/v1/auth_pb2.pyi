from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class OAuthCommon(_message.Message):
    __slots__ = ("client_id", "client_secret", "token_url", "audience", "scope")
    CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
    CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
    TOKEN_URL_FIELD_NUMBER: _ClassVar[int]
    AUDIENCE_FIELD_NUMBER: _ClassVar[int]
    SCOPE_FIELD_NUMBER: _ClassVar[int]
    client_id: str
    client_secret: str
    token_url: str
    audience: str
    scope: str
    def __init__(self, client_id: _Optional[str] = ..., client_secret: _Optional[str] = ..., token_url: _Optional[str] = ..., audience: _Optional[str] = ..., scope: _Optional[str] = ...) -> None: ...

class OAuth(_message.Message):
    __slots__ = ()
    class PasswordGrantFlow(_message.Message):
        __slots__ = ("client_id", "client_secret", "token_url", "username", "password", "audience", "scope")
        CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
        TOKEN_URL_FIELD_NUMBER: _ClassVar[int]
        USERNAME_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        AUDIENCE_FIELD_NUMBER: _ClassVar[int]
        SCOPE_FIELD_NUMBER: _ClassVar[int]
        client_id: str
        client_secret: str
        token_url: str
        username: str
        password: str
        audience: str
        scope: str
        def __init__(self, client_id: _Optional[str] = ..., client_secret: _Optional[str] = ..., token_url: _Optional[str] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., audience: _Optional[str] = ..., scope: _Optional[str] = ...) -> None: ...
    class ClientCredentialsFlow(_message.Message):
        __slots__ = ("client_id", "client_secret", "token_url", "audience", "scope")
        CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
        TOKEN_URL_FIELD_NUMBER: _ClassVar[int]
        AUDIENCE_FIELD_NUMBER: _ClassVar[int]
        SCOPE_FIELD_NUMBER: _ClassVar[int]
        client_id: str
        client_secret: str
        token_url: str
        audience: str
        scope: str
        def __init__(self, client_id: _Optional[str] = ..., client_secret: _Optional[str] = ..., token_url: _Optional[str] = ..., audience: _Optional[str] = ..., scope: _Optional[str] = ...) -> None: ...
    class AuthorizationCodeFlow(_message.Message):
        __slots__ = ("client_id", "client_secret", "token_url", "auth_url", "audience", "scope", "token_scope", "refresh_token_from_server", "client_auth_method", "subject_token_source", "subject_token_source_static_token", "subject_token_type", "workforce_pool_id", "workforce_provider_id", "billing_project_number", "project_id")
        class SubjectTokenSource(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            SUBJECT_TOKEN_SOURCE_UNSPECIFIED: _ClassVar[OAuth.AuthorizationCodeFlow.SubjectTokenSource]
            SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER: _ClassVar[OAuth.AuthorizationCodeFlow.SubjectTokenSource]
            SUBJECT_TOKEN_SOURCE_STATIC_TOKEN: _ClassVar[OAuth.AuthorizationCodeFlow.SubjectTokenSource]
        SUBJECT_TOKEN_SOURCE_UNSPECIFIED: OAuth.AuthorizationCodeFlow.SubjectTokenSource
        SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER: OAuth.AuthorizationCodeFlow.SubjectTokenSource
        SUBJECT_TOKEN_SOURCE_STATIC_TOKEN: OAuth.AuthorizationCodeFlow.SubjectTokenSource
        CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
        TOKEN_URL_FIELD_NUMBER: _ClassVar[int]
        AUTH_URL_FIELD_NUMBER: _ClassVar[int]
        AUDIENCE_FIELD_NUMBER: _ClassVar[int]
        SCOPE_FIELD_NUMBER: _ClassVar[int]
        TOKEN_SCOPE_FIELD_NUMBER: _ClassVar[int]
        REFRESH_TOKEN_FROM_SERVER_FIELD_NUMBER: _ClassVar[int]
        CLIENT_AUTH_METHOD_FIELD_NUMBER: _ClassVar[int]
        SUBJECT_TOKEN_SOURCE_FIELD_NUMBER: _ClassVar[int]
        SUBJECT_TOKEN_SOURCE_STATIC_TOKEN_FIELD_NUMBER: _ClassVar[int]
        SUBJECT_TOKEN_TYPE_FIELD_NUMBER: _ClassVar[int]
        WORKFORCE_POOL_ID_FIELD_NUMBER: _ClassVar[int]
        WORKFORCE_PROVIDER_ID_FIELD_NUMBER: _ClassVar[int]
        BILLING_PROJECT_NUMBER_FIELD_NUMBER: _ClassVar[int]
        PROJECT_ID_FIELD_NUMBER: _ClassVar[int]
        client_id: str
        client_secret: str
        token_url: str
        auth_url: str
        audience: str
        scope: str
        token_scope: str
        refresh_token_from_server: bool
        client_auth_method: str
        subject_token_source: OAuth.AuthorizationCodeFlow.SubjectTokenSource
        subject_token_source_static_token: str
        subject_token_type: str
        workforce_pool_id: str
        workforce_provider_id: str
        billing_project_number: str
        project_id: str
        def __init__(self, client_id: _Optional[str] = ..., client_secret: _Optional[str] = ..., token_url: _Optional[str] = ..., auth_url: _Optional[str] = ..., audience: _Optional[str] = ..., scope: _Optional[str] = ..., token_scope: _Optional[str] = ..., refresh_token_from_server: bool = ..., client_auth_method: _Optional[str] = ..., subject_token_source: _Optional[_Union[OAuth.AuthorizationCodeFlow.SubjectTokenSource, str]] = ..., subject_token_source_static_token: _Optional[str] = ..., subject_token_type: _Optional[str] = ..., workforce_pool_id: _Optional[str] = ..., workforce_provider_id: _Optional[str] = ..., billing_project_number: _Optional[str] = ..., project_id: _Optional[str] = ...) -> None: ...
    def __init__(self) -> None: ...

class Basic(_message.Message):
    __slots__ = ("username", "password")
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    PASSWORD_FIELD_NUMBER: _ClassVar[int]
    username: str
    password: str
    def __init__(self, username: _Optional[str] = ..., password: _Optional[str] = ...) -> None: ...

class Azure(_message.Message):
    __slots__ = ("key", "client_credentials")
    class Key(_message.Message):
        __slots__ = ("master_key",)
        MASTER_KEY_FIELD_NUMBER: _ClassVar[int]
        master_key: str
        def __init__(self, master_key: _Optional[str] = ...) -> None: ...
    class ClientCredentials(_message.Message):
        __slots__ = ("client_id", "client_secret")
        CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        CLIENT_SECRET_FIELD_NUMBER: _ClassVar[int]
        client_id: str
        client_secret: str
        def __init__(self, client_id: _Optional[str] = ..., client_secret: _Optional[str] = ...) -> None: ...
    KEY_FIELD_NUMBER: _ClassVar[int]
    CLIENT_CREDENTIALS_FIELD_NUMBER: _ClassVar[int]
    key: Azure.Key
    client_credentials: Azure.ClientCredentials
    def __init__(self, key: _Optional[_Union[Azure.Key, _Mapping]] = ..., client_credentials: _Optional[_Union[Azure.ClientCredentials, _Mapping]] = ...) -> None: ...

class AwsAuth(_message.Message):
    __slots__ = ("static", "assume_role", "region")
    class Static(_message.Message):
        __slots__ = ("access_key_id", "secret_access_key")
        ACCESS_KEY_ID_FIELD_NUMBER: _ClassVar[int]
        SECRET_ACCESS_KEY_FIELD_NUMBER: _ClassVar[int]
        access_key_id: str
        secret_access_key: str
        def __init__(self, access_key_id: _Optional[str] = ..., secret_access_key: _Optional[str] = ...) -> None: ...
    class AssumeRole(_message.Message):
        __slots__ = ("role_arn",)
        ROLE_ARN_FIELD_NUMBER: _ClassVar[int]
        role_arn: str
        def __init__(self, role_arn: _Optional[str] = ...) -> None: ...
    STATIC_FIELD_NUMBER: _ClassVar[int]
    ASSUME_ROLE_FIELD_NUMBER: _ClassVar[int]
    REGION_FIELD_NUMBER: _ClassVar[int]
    static: AwsAuth.Static
    assume_role: AwsAuth.AssumeRole
    region: str
    def __init__(self, static: _Optional[_Union[AwsAuth.Static, _Mapping]] = ..., assume_role: _Optional[_Union[AwsAuth.AssumeRole, _Mapping]] = ..., region: _Optional[str] = ...) -> None: ...

class GcpAuth(_message.Message):
    __slots__ = ("service_account",)
    SERVICE_ACCOUNT_FIELD_NUMBER: _ClassVar[int]
    service_account: bytes
    def __init__(self, service_account: _Optional[bytes] = ...) -> None: ...

class AkeylessAuth(_message.Message):
    __slots__ = ("api_key", "email")
    class ApiKey(_message.Message):
        __slots__ = ("access_id", "access_key")
        ACCESS_ID_FIELD_NUMBER: _ClassVar[int]
        ACCESS_KEY_FIELD_NUMBER: _ClassVar[int]
        access_id: str
        access_key: str
        def __init__(self, access_id: _Optional[str] = ..., access_key: _Optional[str] = ...) -> None: ...
    class Email(_message.Message):
        __slots__ = ("email", "password")
        EMAIL_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        email: str
        password: str
        def __init__(self, email: _Optional[str] = ..., password: _Optional[str] = ...) -> None: ...
    API_KEY_FIELD_NUMBER: _ClassVar[int]
    EMAIL_FIELD_NUMBER: _ClassVar[int]
    api_key: AkeylessAuth.ApiKey
    email: AkeylessAuth.Email
    def __init__(self, api_key: _Optional[_Union[AkeylessAuth.ApiKey, _Mapping]] = ..., email: _Optional[_Union[AkeylessAuth.Email, _Mapping]] = ...) -> None: ...

class Auth(_message.Message):
    __slots__ = ("password_grant_flow", "authorization_code_flow", "basic", "client_credentials_flow", "key", "oauth_token_exchange")
    class Nothing(_message.Message):
        __slots__ = ()
        def __init__(self) -> None: ...
    PASSWORD_GRANT_FLOW_FIELD_NUMBER: _ClassVar[int]
    AUTHORIZATION_CODE_FLOW_FIELD_NUMBER: _ClassVar[int]
    BASIC_FIELD_NUMBER: _ClassVar[int]
    CLIENT_CREDENTIALS_FLOW_FIELD_NUMBER: _ClassVar[int]
    KEY_FIELD_NUMBER: _ClassVar[int]
    OAUTH_TOKEN_EXCHANGE_FIELD_NUMBER: _ClassVar[int]
    password_grant_flow: OAuth.PasswordGrantFlow
    authorization_code_flow: OAuth.AuthorizationCodeFlow
    basic: Basic
    client_credentials_flow: OAuth.ClientCredentialsFlow
    key: Azure.Key
    oauth_token_exchange: Auth.Nothing
    def __init__(self, password_grant_flow: _Optional[_Union[OAuth.PasswordGrantFlow, _Mapping]] = ..., authorization_code_flow: _Optional[_Union[OAuth.AuthorizationCodeFlow, _Mapping]] = ..., basic: _Optional[_Union[Basic, _Mapping]] = ..., client_credentials_flow: _Optional[_Union[OAuth.ClientCredentialsFlow, _Mapping]] = ..., key: _Optional[_Union[Azure.Key, _Mapping]] = ..., oauth_token_exchange: _Optional[_Union[Auth.Nothing, _Mapping]] = ...) -> None: ...
