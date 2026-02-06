from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Signature(_message.Message):
    __slots__ = ("key_id", "data", "public_key", "algorithm")
    class Algorithm(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        ALGORITHM_UNSPECIFIED: _ClassVar[Signature.Algorithm]
        ALGORITHM_ED25519: _ClassVar[Signature.Algorithm]
    ALGORITHM_UNSPECIFIED: Signature.Algorithm
    ALGORITHM_ED25519: Signature.Algorithm
    KEY_ID_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    PUBLIC_KEY_FIELD_NUMBER: _ClassVar[int]
    ALGORITHM_FIELD_NUMBER: _ClassVar[int]
    key_id: str
    data: bytes
    public_key: bytes
    algorithm: Signature.Algorithm
    def __init__(self, key_id: _Optional[str] = ..., data: _Optional[bytes] = ..., public_key: _Optional[bytes] = ..., algorithm: _Optional[_Union[Signature.Algorithm, str]] = ...) -> None: ...
