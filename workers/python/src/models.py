from typing import Optional, TypedDict


class Quotas(TypedDict):
    size: Optional[int]
    duration: Optional[int]
