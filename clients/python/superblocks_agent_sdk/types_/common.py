from typing import Union

JsonValue = Union[str, float, int, bool, None, "JsonObject", "JsonArray"]
# NOTE: (joey) pdoc3 doesn't really have good support for type documentation, so this is the best we can do for now
"""
- str
- float
- int
- bool
- None
- dict[str, JsonValue]
- list[JsonValue]
"""
JsonObject = dict[str, JsonValue]
JsonArray = list[JsonValue]


# NOTE: (joey) since we are using ForwardRefs in our Union type, we can't use isinstance cleanly.
# this function is the cleanest way i can think of for now
# SOURCES:
# https://stackoverflow.com/questions/76106117/python-resolve-forwardref
# https://stackoverflow.com/questions/45957615/how-to-check-a-variable-against-union-type-during-runtime
def is_json_value(value: any) -> bool:
    """
    Used in place of `isinstance` to check if a given value is of type JsonValue.

    Args:
        value (any): The value to check.

    Returns:
        bool: Whether the given value is of type JsonValue.
    """
    if isinstance(value, (str, float, int, bool)) or value is None:
        return True
    elif isinstance(value, dict):
        return all(isinstance(k, str) and is_json_value(v) for k, v in value.items())
    elif isinstance(value, list):
        return all(is_json_value(i) for i in value)
    return False
