from abc import ABC, abstractmethod


class DictSerializable(ABC):
    @abstractmethod
    def to_dict(self) -> dict:
        """
        Takes *this* instance of the implemented method's class and returns its representation as a dictionary.
        """
