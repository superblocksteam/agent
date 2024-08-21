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
    async def read(self, keys: List[str]) -> Tuple[List[Any], int]:
        pass

    @abstractmethod
    async def write(
        self, key: str, value: Any, expiration_seconds: Optional[int] = 3600
    ) -> int:
        pass

    @abstractmethod
    async def write_many(self, payload: List[KV], ops: Optional[WriteOps]) -> int:
        pass

    @abstractmethod
    async def delete(self, keys: str) -> None:
        pass

    @abstractmethod
    async def close(self, reason: str) -> None:
        pass


class MockStore(KVStore):
    kv: dict[str, Any] = {}

    async def read(self, keys: List[str]) -> Tuple[List[Any], int]:
        res = []
        for key in keys:
            res.append(self.kv.get(key))
        return res, 0

    async def write(
        self, key: str, value: Any, expiration_seconds: Optional[int] = 3600
    ) -> int:
        self.kv[key] = value
        return 0

    async def write_many(self, payload: List[KV], ops: Optional[WriteOps]) -> int:
        for t in payload:
            self.kv[t.key] = t.value
        return 0

    async def delete(self, keys: str) -> None:
        raise NotImplementedError()

    async def close(self, reason: str) -> None:
        raise NotImplementedError()
