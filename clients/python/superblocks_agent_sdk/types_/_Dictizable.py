from __future__ import annotations

from ._DictDeserializable import DictDeserializable
from ._DictSerializable import DictSerializable


class Dictizable(DictSerializable, DictDeserializable): ...
