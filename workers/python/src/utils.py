from typing import Dict, List, Literal, Optional

from pydash import get
from superblocks import Object


def extract_vars(context) -> Object:
    output = Object({})
    for p in dir(context):
        if p.startswith("__"):
            continue
        attr = getattr(context, p)
        if callable(attr):
            continue

        output[p] = attr
    return output


def is_readable_file(root):
    def _is_readable_file(key, value):
        if key in ["name", "extension", "type", "encoding", "$superblocksId"]:
            return isinstance(value, str)
        if key == ["previewUrl", "path"]:
            return isinstance(value, str) or (value is None)

        return True

    if not isinstance(root, dict) or len(root.items()) == 0:
        return False

    # List of keys expected in a file object provided in the context
    # We must assert that the object contains these fields exactly.
    required_file_keys = {
        "name",
        "extension",
        "type",
        "encoding",
        "$superblocksId",
        "size",
        "previewUrl",
    }

    optional_file_keys = {"path"}

    all_file_keys = required_file_keys.union(optional_file_keys)

    root_keys = set(root.keys())

    return all_file_keys <= root_keys.union(optional_file_keys) and all(
        _is_readable_file(key, value) for key, value in root.items()
    )


def get_file_paths(root: Optional[Dict | List], path: List = []) -> List:
    paths: List = []
    if (root is None) or (
        (not isinstance(root, dict)) and (not isinstance(root, list))
    ):
        return paths

    if isinstance(root, list):
        for idx, node in enumerate(root):
            paths = [*paths, *get_file_paths(node, [*path, str(idx)])]
        return paths

    if is_readable_file(root):
        return [path]

    # we're guaranteed that root is a dict at this point
    for key, value in root.items():
        if is_readable_file(value):
            paths.append([*path, key])
        elif value is not None and isinstance(value, list):
            for idx, item in enumerate(value):
                paths = [*paths, *get_file_paths(item, [*path, key, str(idx)])]
        elif value is not None and isinstance(value, dict):
            paths = [*paths, *get_file_paths(value, [*path, key])]

    return paths


def get_tree_path_to_disk_path(tree, files) -> Dict:
    file_paths = get_file_paths(tree)

    def _map(path):
        sb_id = get(tree, path).get("$superblocksId")
        match = next(
            filter(lambda file: file.get("originalname") == sb_id, files), None
        )
        return None if match is None else match.get("path")

    file_disk_paths = list(map(lambda path: _map(path), file_paths))

    for idx, path in enumerate(file_paths):
        file_paths[idx] = [".".join(path), file_disk_paths[idx]]

    return dict(filter(lambda file: file[1] is not None, file_paths))


def deep_contains(obj: dict, p: str, level=0) -> bool:
    if level >= 1000:
        raise RecursionError("Object has nested depth >= 1000")

    for value in obj.values():
        if isinstance(value, str) and p in value:
            return True
        elif isinstance(value, dict) and deep_contains(value, p, level + 1):
            return True

    return False


def encode_int_to_bytes(
    n, length: int = 8, byteorder: Literal["little", "big"] = "little"
) -> bytes:
    bytes_ = n.to_bytes(length, byteorder)
    return bytes_


def decode_bytes_to_int(bytes_, byteorder: Literal["little", "big"] = "little") -> int:
    n = int.from_bytes(bytes_, byteorder)
    return n
