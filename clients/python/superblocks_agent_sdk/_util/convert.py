import json
from typing import Optional

from google.protobuf.json_format import MessageToJson, Parse
from google.protobuf.struct_pb2 import Value

from superblocks_types.api.v1.service_pb2 import Mock as ProtoMock


def to_protobuf_value(data: Optional[bool | int | float | str | dict | list]) -> Value:
    """Returns the protobuf value of the given native Python value."""
    return Parse(json.dumps(data), message=Value())


def from_protobuf_value(
    proto_value: Value,
) -> Optional[int | float | str | bool | dict | list]:
    """Extracts native Python value from the given protobuf Value."""
    return json.loads(MessageToJson(proto_value))


# some protos use reserved keywords (like 'return')
# to keep the simplicity of using the constructor, we can mimic the constructors here
# NOTE: (joey) there's probably a better pattern for this, something to think about


def Mock_(
    *, on: Optional[ProtoMock.On] = None, return_: Optional[ProtoMock.Return] = None
) -> ProtoMock:
    mock = ProtoMock()
    if on is not None:
        mock.on.CopyFrom(on)
    if return_ is not None:
        # NOTE: return is a reserved keyword, this workaround seems to do the trick
        # source: https://stackoverflow.com/questions/30142750/reserved-keyword-is-used-in-protobuf-in-python
        return_value = getattr(mock, "return")
        return_value.CopyFrom(return_)
    return mock
