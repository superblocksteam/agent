from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Links(_message.Message):
    __slots__ = ("links",)
    class LinksEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: Link
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Link, _Mapping]] = ...) -> None: ...
    LINKS_FIELD_NUMBER: _ClassVar[int]
    links: _containers.MessageMap[str, Link]
    def __init__(self, links: _Optional[_Mapping[str, Link]] = ...) -> None: ...

class LinksV2(_message.Message):
    __slots__ = ("links",)
    LINKS_FIELD_NUMBER: _ClassVar[int]
    links: _containers.RepeatedCompositeFieldContainer[Links]
    def __init__(self, links: _Optional[_Iterable[_Union[Links, _Mapping]]] = ...) -> None: ...

class Link(_message.Message):
    __slots__ = ("url",)
    URL_FIELD_NUMBER: _ClassVar[int]
    url: str
    def __init__(self, url: _Optional[str] = ...) -> None: ...

class CombinedLinks(_message.Message):
    __slots__ = ("links", "links_v2")
    class LinksEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: Link
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[Link, _Mapping]] = ...) -> None: ...
    LINKS_FIELD_NUMBER: _ClassVar[int]
    LINKS_V2_FIELD_NUMBER: _ClassVar[int]
    links: _containers.MessageMap[str, Link]
    links_v2: _containers.RepeatedCompositeFieldContainer[Links]
    def __init__(self, links: _Optional[_Mapping[str, Link]] = ..., links_v2: _Optional[_Iterable[_Union[Links, _Mapping]]] = ...) -> None: ...
