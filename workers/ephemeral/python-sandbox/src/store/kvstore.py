from abc import abstractmethod
from typing import Any, List, Optional, Tuple, TypedDict


class KVOps(TypedDict):
    baggage: Optional[dict[str, str]]


class WriteOps(KVOps):
    maxSize: Optional[int]
    expiration: Optional[int]


class KV:
    key: str
    value: Any
    expiration: Optional[int]

    def __init__(self, key: str, value: Any, expiration: Optional[int] = 3600):
        self.key = key
        self.value = value
        self.expiration = expiration


class KVStore:
    @abstractmethod
    def read(self, keys: List[str]) -> Tuple[List[Any], int]:
        pass

    @abstractmethod
    def write(
        self, key: str, value: Any, expiration_seconds: Optional[int] = 3600
    ) -> int:
        pass

    @abstractmethod
    def write_many(self, payload: List[KV], ops: Optional[WriteOps]) -> int:
        pass

    @abstractmethod
    def delete(self, keys: str) -> None:
        pass

    @abstractmethod
    def fetch_file(self, path: str) -> bytes:
        pass

    @abstractmethod
    def close(self, reason: str) -> None:
        pass


class MockStore(KVStore):
    kv: dict[str, Any] = {}

    def read(self, keys: List[str]) -> Tuple[List[Any], int]:
        res = []
        for key in keys:
            res.append(self.kv.get(key))
        return res, 0

    def write(
        self, key: str, value: Any, expiration_seconds: Optional[int] = 3600
    ) -> int:
        self.kv[key] = value
        return 0

    def write_many(self, payload: List[KV], ops: Optional[WriteOps]) -> int:
        for t in payload:
            self.kv[t.key] = t.value
        return 0

    def delete(self, keys: str) -> None:
        raise NotImplementedError()

    def fetch_file(self, path: str) -> bytes:
        raise NotImplementedError()

    def close(self, reason: str) -> None:
        raise NotImplementedError()
