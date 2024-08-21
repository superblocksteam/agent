from __future__ import annotations

from abc import ABC, abstractmethod


class DictDeserializable(ABC):
    @staticmethod
    @abstractmethod
    def _from_dict(d: dict) -> DictDeserializable:
        """
        Takes a dict and turns it into an instance of *this* class.
        """
