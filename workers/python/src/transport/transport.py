from abc import ABC, abstractmethod


class Transport(ABC):
    @abstractmethod
    async def init(self) -> None:
        pass

    @abstractmethod
    async def close(self, reason: str) -> None:
        pass

    @abstractmethod
    def alive(self) -> bool:
        pass
