# Module for overriding object hook in socketio
import json
from numbers import Number
from typing import Any, Dict

from superblocks import Object


# If we received a value that is a bytestring encoded using the node.js encoding for
# node.js Buffers (https://nodejs.org/api/buffer.html#buftojson), then decode it as a bytes
# object in python.
# For example, this will turn:
#     {"Type": "Buffer", "data": [140, 141]}
# into:
#     b"\x8c\x8d"
def __decode_object(value):
    if (
        "type" in value
        and value["type"] == "Buffer"
        and "data" in value
        and isinstance(value["data"], list)
        and all(isinstance(x, Number) for x in value["data"])
    ):
        # do the equivalent of decodeBytestrings from shared-backend
        return bytes(value["data"])
    else:
        return Object(value)


def loads(*args, **kwargs) -> Any:
    # WARNING: Modifying the JSONDecoder behaviour to wrap JSONArray's return value
    # as a Superblocks List has a very significant impact on performance.
    # This makes me very sad since it's a very clean solution.
    # We'll need to be okay with the lists not explicitly having a type and rely
    # on the on access type conversion in our Superblocks Objects.
    # In effect, this should only really be experienced if the top level object
    # is an array, which should never happen when passing around execution
    # contexts.
    kwargs["object_hook"] = __decode_object
    return json.loads(*args, **kwargs)


def dumps(*args, **kwargs) -> str:
    return json.dumps(*args, **kwargs)


def encode_bytestring_as_json(value) -> Dict[str, Any]:
    if isinstance(value, bytes) or isinstance(value, bytearray):
        # use the node.js enconding for Buffers
        return {"type": "Buffer", "data": [x for x in value]}
    raise TypeError(repr(value) + " is not JSON serializable")
