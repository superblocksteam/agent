from __future__ import annotations

from abc import abstractmethod
from enum import Enum, unique


@unique
class BaseEnum(Enum):
    """
    Should be inherited by all enums.
    """

    ...

    @staticmethod
    @abstractmethod
    def _items() -> list[tuple[BaseEnum, str]]:
        """
        Get all items from this enum.

        Returns:
            list[tuple[BaseEnum, str]]: The items from this enum.
        """
        ...

    @classmethod
    def _from_str(cls, s: str) -> BaseEnum:
        """
        Convert from a string to *this* enum.

        Args:
            s (str): The string to convert from.

        Returns:
            BaseEnum: The enum.
        """
        ...
