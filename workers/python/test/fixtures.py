from typing import Any

import superblocks_json


def dump_and_load(data: Any) -> Any:
    # same invocations as python-engineio
    return superblocks_json.loads(superblocks_json.dumps(data, separators=(",", ":")))
