"""Superblocks type wrappers for dot notation access."""

import base64
import json
from base64 import b64encode
from numbers import Number
from typing import Any, Dict


class Object(dict):
    """Wrapper around dict that provides dot.notation access to dictionary attributes"""

    def __getattr__(self, key):
        try:
            if type(self[key]) is dict:
                return Object(self[key])
            elif type(self[key]) is list:
                return List(self[key])
            else:
                return self[key]

        except KeyError as k:
            raise AttributeError(f"object has no attribute {k}")

    def __getitem__(self, key):
        cur_item = dict.__getitem__(self, key)
        if type(cur_item) is dict:
            return Object(cur_item)
        elif type(cur_item) is list:
            return List(cur_item)
        else:
            return cur_item

    __setattr__ = dict.__setitem__  # type: ignore
    __delattr__ = dict.__delitem__  # type: ignore

    @property
    def __dict__(self):
        return self


class List(list):
    def __getitem__(self, n):
        cur_item = list.__getitem__(self, n)
        if type(cur_item) is dict:
            return Object(cur_item)
        elif type(cur_item) is list:
            return List(cur_item)
        else:
            return cur_item


class Reader:
    """File reader that fetches files via gRPC from task-manager."""

    def __init__(self, file_fetcher):
        """
        Initialize Reader with a file fetcher function.

        Args:
            file_fetcher: A callable that takes (path) and returns file contents as bytes
        """
        self._file_fetcher = file_fetcher

    def readContents(self, name, path, mode=None):
        """Read file contents and serialize based on mode."""
        from io import BytesIO

        contents = self._file_fetcher(path)
        buf = BytesIO(contents)
        return self.__serialize(buf, name, mode)

    async def readContentsAsync(self, name, path, mode=None):
        """Async version of readContents."""
        import asyncio
        from io import BytesIO

        # Wrap sync fetcher in thread to avoid blocking
        contents = await asyncio.to_thread(self._file_fetcher, path)
        buf = BytesIO(contents)
        return self.__serialize(buf, name, mode)

    def __serialize(self, f, name, mode=None):
        f.seek(0)
        if mode == "raw":
            return f.read()
        textchars = bytearray(
            {7, 8, 9, 10, 12, 13, 27} | set(range(0x20, 0x100)) - {0x7F}
        )

        def is_binary_string(bytes_data):
            return bool(bytes_data.translate(None, textchars))

        bytes_data = f.read(1024)
        f.seek(0)
        if mode == "binary" or is_binary_string(bytes_data):
            if mode == "text":
                raise ValueError(
                    f"File {name} has binary data. Call .readContents('binary') and then apply your own encoding"
                )
            return b64encode(f.read()).decode("ascii")
        if mode == "binary":
            raise ValueError(
                f"File {name} is text. Call .readContents('text') and "
                "then apply your own encoding like .encode('latin1')"
            )
        return f.read().decode("utf8")


def decode_object(value: dict) -> Any:
    """Decode objects, handling Node.js Buffer format."""
    if (
        "type" in value
        and value["type"] == "Buffer"
        and "data" in value
        and isinstance(value["data"], list)
        and all(isinstance(x, Number) for x in value["data"])
    ):
        return bytes(value["data"])
    else:
        return Object(value)


def loads(data: str) -> Any:
    """Load JSON with object hook for Superblocks types."""
    return json.loads(data, object_hook=decode_object)


def encode_bytestring_as_json(value) -> Dict[str, Any]:
    """Encode bytes/bytearray as Node.js Buffer format."""
    if isinstance(value, bytes) or isinstance(value, bytearray):
        return {"type": "Buffer", "data": [x for x in value]}
    raise TypeError(repr(value) + " is not JSON serializable")
