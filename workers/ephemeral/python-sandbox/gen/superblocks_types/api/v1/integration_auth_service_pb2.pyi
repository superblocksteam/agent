from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import common_pb2 as _common_pb2
from google.api import annotations_pb2 as _annotations_pb2
from google.protobuf import empty_pb2 as _empty_pb2
from plugins.common.v1 import auth_pb2 as _auth_pb2
from protoc_gen_openapiv2.options import annotations_pb2 as _annotations_pb2_1
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CheckAuthRequest(_message.Message):
    __slots__ = ("integration_id", "profile")
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    profile: _common_pb2.Profile
    def __init__(self, integration_id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ...) -> None: ...

class CheckAuthResponse(_message.Message):
    __slots__ = ("authenticated",)
    AUTHENTICATED_FIELD_NUMBER: _ClassVar[int]
    authenticated: bool
    def __init__(self, authenticated: bool = ...) -> None: ...

class LoginRequest(_message.Message):
    __slots__ = ("integration_id", "profile", "token", "refreshToken", "idToken", "expiryTimestamp")
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    TOKEN_FIELD_NUMBER: _ClassVar[int]
    REFRESHTOKEN_FIELD_NUMBER: _ClassVar[int]
    IDTOKEN_FIELD_NUMBER: _ClassVar[int]
    EXPIRYTIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    profile: _common_pb2.Profile
    token: str
    refreshToken: str
    idToken: str
    expiryTimestamp: int
    def __init__(self, integration_id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., token: _Optional[str] = ..., refreshToken: _Optional[str] = ..., idToken: _Optional[str] = ..., expiryTimestamp: _Optional[int] = ...) -> None: ...

class LoginResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class ExchangeOauthCodeForTokenRequest(_message.Message):
    __slots__ = ("integration_id", "profile", "access_code", "auth_type", "auth_config", "configuration_id")
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    ACCESS_CODE_FIELD_NUMBER: _ClassVar[int]
    AUTH_TYPE_FIELD_NUMBER: _ClassVar[int]
    AUTH_CONFIG_FIELD_NUMBER: _ClassVar[int]
    CONFIGURATION_ID_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    profile: _common_pb2.Profile
    access_code: str
    auth_type: str
    auth_config: _auth_pb2.OAuth.AuthorizationCodeFlow
    configuration_id: str
    def __init__(self, integration_id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., access_code: _Optional[str] = ..., auth_type: _Optional[str] = ..., auth_config: _Optional[_Union[_auth_pb2.OAuth.AuthorizationCodeFlow, _Mapping]] = ..., configuration_id: _Optional[str] = ...) -> None: ...

class RequestOauthPasswordTokenRequest(_message.Message):
    __slots__ = ("integration_id", "profile", "username", "password")
    INTEGRATION_ID_FIELD_NUMBER: _ClassVar[int]
    PROFILE_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    PASSWORD_FIELD_NUMBER: _ClassVar[int]
    integration_id: str
    profile: _common_pb2.Profile
    username: str
    password: str
    def __init__(self, integration_id: _Optional[str] = ..., profile: _Optional[_Union[_common_pb2.Profile, _Mapping]] = ..., username: _Optional[str] = ..., password: _Optional[str] = ...) -> None: ...

class RequestOauthPasswordTokenResponse(_message.Message):
    __slots__ = ("access_token", "refresh_token", "expiry_timestamp")
    ACCESS_TOKEN_FIELD_NUMBER: _ClassVar[int]
    REFRESH_TOKEN_FIELD_NUMBER: _ClassVar[int]
    EXPIRY_TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    access_token: str
    refresh_token: str
    expiry_timestamp: int
    def __init__(self, access_token: _Optional[str] = ..., refresh_token: _Optional[str] = ..., expiry_timestamp: _Optional[int] = ...) -> None: ...
