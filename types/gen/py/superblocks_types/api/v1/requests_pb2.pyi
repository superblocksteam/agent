from api.v1 import api_pb2 as _api_pb2
from buf.validate import validate_pb2 as _validate_pb2
from common.v1 import api_pb2 as _api_pb2_1
from common.v1 import errors_pb2 as _errors_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from google.protobuf import timestamp_pb2 as _timestamp_pb2
from utils.v1 import utils_pb2 as _utils_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class PatchApi(_message.Message):
    __slots__ = ("api", "commit_id", "branch_name")
    API_FIELD_NUMBER: _ClassVar[int]
    COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
    BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
    api: _api_pb2.Api
    commit_id: str
    branch_name: str
    def __init__(self, api: _Optional[_Union[_api_pb2.Api, _Mapping]] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ...) -> None: ...

class PatchApisRequest(_message.Message):
    __slots__ = ("patches",)
    PATCHES_FIELD_NUMBER: _ClassVar[int]
    patches: _containers.RepeatedCompositeFieldContainer[PatchApi]
    def __init__(self, patches: _Optional[_Iterable[_Union[PatchApi, _Mapping]]] = ...) -> None: ...

class PatchApisResponse(_message.Message):
    __slots__ = ("statuses", "links", "links_v2")
    class Status(_message.Message):
        __slots__ = ("api_id", "code", "message", "error")
        API_ID_FIELD_NUMBER: _ClassVar[int]
        CODE_FIELD_NUMBER: _ClassVar[int]
        MESSAGE_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        api_id: str
        code: int
        message: str
        error: _errors_pb2.Error
        def __init__(self, api_id: _Optional[str] = ..., code: _Optional[int] = ..., message: _Optional[str] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...
    class LinksEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _api_pb2_1.Link
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_api_pb2_1.Link, _Mapping]] = ...) -> None: ...
    STATUSES_FIELD_NUMBER: _ClassVar[int]
    LINKS_FIELD_NUMBER: _ClassVar[int]
    LINKS_V2_FIELD_NUMBER: _ClassVar[int]
    statuses: _containers.RepeatedCompositeFieldContainer[PatchApisResponse.Status]
    links: _containers.MessageMap[str, _api_pb2_1.Link]
    links_v2: _containers.RepeatedCompositeFieldContainer[_api_pb2_1.Links]
    def __init__(self, statuses: _Optional[_Iterable[_Union[PatchApisResponse.Status, _Mapping]]] = ..., links: _Optional[_Mapping[str, _api_pb2_1.Link]] = ..., links_v2: _Optional[_Iterable[_Union[_api_pb2_1.Links, _Mapping]]] = ...) -> None: ...

class UpdateApiSignature(_message.Message):
    __slots__ = ("api_id", "commit_id", "branch_name", "signature", "errors", "updated")
    API_ID_FIELD_NUMBER: _ClassVar[int]
    COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
    BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
    SIGNATURE_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    UPDATED_FIELD_NUMBER: _ClassVar[int]
    api_id: str
    commit_id: str
    branch_name: str
    signature: _utils_pb2.Signature
    errors: SignatureRotationErrors
    updated: _timestamp_pb2.Timestamp
    def __init__(self, api_id: _Optional[str] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., signature: _Optional[_Union[_utils_pb2.Signature, _Mapping]] = ..., errors: _Optional[_Union[SignatureRotationErrors, _Mapping]] = ..., updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class UpdateApplicationSignature(_message.Message):
    __slots__ = ("application_id", "commit_id", "branch_name", "signature", "errors", "updated", "page_version")
    APPLICATION_ID_FIELD_NUMBER: _ClassVar[int]
    COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
    BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
    SIGNATURE_FIELD_NUMBER: _ClassVar[int]
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    UPDATED_FIELD_NUMBER: _ClassVar[int]
    PAGE_VERSION_FIELD_NUMBER: _ClassVar[int]
    application_id: str
    commit_id: str
    branch_name: str
    signature: _utils_pb2.Signature
    errors: SignatureRotationErrors
    updated: _timestamp_pb2.Timestamp
    page_version: int
    def __init__(self, application_id: _Optional[str] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., signature: _Optional[_Union[_utils_pb2.Signature, _Mapping]] = ..., errors: _Optional[_Union[SignatureRotationErrors, _Mapping]] = ..., updated: _Optional[_Union[_timestamp_pb2.Timestamp, _Mapping]] = ..., page_version: _Optional[int] = ...) -> None: ...

class SignatureRotationErrors(_message.Message):
    __slots__ = ("errors", "key_id", "public_key", "algorithm")
    ERRORS_FIELD_NUMBER: _ClassVar[int]
    KEY_ID_FIELD_NUMBER: _ClassVar[int]
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    ALGORITHM_FIELD_NUMBER: _ClassVar[int]
    errors: _containers.RepeatedCompositeFieldContainer[SignatureRotationError]
    key_id: str
    public_key: bytes
    algorithm: _utils_pb2.Signature.Algorithm
    def __init__(self, errors: _Optional[_Iterable[_Union[SignatureRotationError, _Mapping]]] = ..., key_id: _Optional[str] = ..., public_key: _Optional[bytes] = ..., algorithm: _Optional[_Union[_utils_pb2.Signature.Algorithm, str]] = ...) -> None: ...

class SignatureRotationError(_message.Message):
    __slots__ = ("message",)
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    message: str
    def __init__(self, message: _Optional[str] = ...) -> None: ...

class UpdateApiSignaturesRequest(_message.Message):
    __slots__ = ("updates",)
    UPDATES_FIELD_NUMBER: _ClassVar[int]
    updates: _containers.RepeatedCompositeFieldContainer[UpdateApiSignature]
    def __init__(self, updates: _Optional[_Iterable[_Union[UpdateApiSignature, _Mapping]]] = ...) -> None: ...

class UpdateApplicationSignaturesRequest(_message.Message):
    __slots__ = ("updates",)
    UPDATES_FIELD_NUMBER: _ClassVar[int]
    updates: _containers.RepeatedCompositeFieldContainer[UpdateApplicationSignature]
    def __init__(self, updates: _Optional[_Iterable[_Union[UpdateApplicationSignature, _Mapping]]] = ...) -> None: ...

class UpdateApplicationSignaturesResponse(_message.Message):
    __slots__ = ("statuses", "links", "links_v2")
    class Status(_message.Message):
        __slots__ = ("application_id", "commit_id", "branch_name", "code", "message", "error")
        APPLICATION_ID_FIELD_NUMBER: _ClassVar[int]
        COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
        BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
        CODE_FIELD_NUMBER: _ClassVar[int]
        MESSAGE_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        application_id: str
        commit_id: str
        branch_name: str
        code: int
        message: str
        error: _errors_pb2.Error
        def __init__(self, application_id: _Optional[str] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., code: _Optional[int] = ..., message: _Optional[str] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...
    class LinksEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _api_pb2_1.Link
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_api_pb2_1.Link, _Mapping]] = ...) -> None: ...
    STATUSES_FIELD_NUMBER: _ClassVar[int]
    LINKS_FIELD_NUMBER: _ClassVar[int]
    LINKS_V2_FIELD_NUMBER: _ClassVar[int]
    statuses: _containers.RepeatedCompositeFieldContainer[UpdateApplicationSignaturesResponse.Status]
    links: _containers.MessageMap[str, _api_pb2_1.Link]
    links_v2: _containers.RepeatedCompositeFieldContainer[_api_pb2_1.Links]
    def __init__(self, statuses: _Optional[_Iterable[_Union[UpdateApplicationSignaturesResponse.Status, _Mapping]]] = ..., links: _Optional[_Mapping[str, _api_pb2_1.Link]] = ..., links_v2: _Optional[_Iterable[_Union[_api_pb2_1.Links, _Mapping]]] = ...) -> None: ...

class UpdateApiSignaturesResponse(_message.Message):
    __slots__ = ("statuses", "links", "links_v2")
    class Status(_message.Message):
        __slots__ = ("api_id", "commit_id", "branch_name", "code", "message", "error")
        API_ID_FIELD_NUMBER: _ClassVar[int]
        COMMIT_ID_FIELD_NUMBER: _ClassVar[int]
        BRANCH_NAME_FIELD_NUMBER: _ClassVar[int]
        CODE_FIELD_NUMBER: _ClassVar[int]
        MESSAGE_FIELD_NUMBER: _ClassVar[int]
        ERROR_FIELD_NUMBER: _ClassVar[int]
        api_id: str
        commit_id: str
        branch_name: str
        code: int
        message: str
        error: _errors_pb2.Error
        def __init__(self, api_id: _Optional[str] = ..., commit_id: _Optional[str] = ..., branch_name: _Optional[str] = ..., code: _Optional[int] = ..., message: _Optional[str] = ..., error: _Optional[_Union[_errors_pb2.Error, _Mapping]] = ...) -> None: ...
    class LinksEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: _api_pb2_1.Link
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[_api_pb2_1.Link, _Mapping]] = ...) -> None: ...
    STATUSES_FIELD_NUMBER: _ClassVar[int]
    LINKS_FIELD_NUMBER: _ClassVar[int]
    LINKS_V2_FIELD_NUMBER: _ClassVar[int]
    statuses: _containers.RepeatedCompositeFieldContainer[UpdateApiSignaturesResponse.Status]
    links: _containers.MessageMap[str, _api_pb2_1.Link]
    links_v2: _containers.RepeatedCompositeFieldContainer[_api_pb2_1.Links]
    def __init__(self, statuses: _Optional[_Iterable[_Union[UpdateApiSignaturesResponse.Status, _Mapping]]] = ..., links: _Optional[_Mapping[str, _api_pb2_1.Link]] = ..., links_v2: _Optional[_Iterable[_Union[_api_pb2_1.Links, _Mapping]]] = ...) -> None: ...

class GenericBatch(_message.Message):
    __slots__ = ("data",)
    class Items(_message.Message):
        __slots__ = ("items",)
        ITEMS_FIELD_NUMBER: _ClassVar[int]
        items: _containers.RepeatedCompositeFieldContainer[_struct_pb2.Struct]
        def __init__(self, items: _Optional[_Iterable[_Union[_struct_pb2.Struct, _Mapping]]] = ...) -> None: ...
    DATA_FIELD_NUMBER: _ClassVar[int]
    data: GenericBatch.Items
    def __init__(self, data: _Optional[_Union[GenericBatch.Items, _Mapping]] = ...) -> None: ...

class GenericBatchResponse(_message.Message):
    __slots__ = ("data",)
    DATA_FIELD_NUMBER: _ClassVar[int]
    data: GenericBatch
    def __init__(self, data: _Optional[_Union[GenericBatch, _Mapping]] = ...) -> None: ...
