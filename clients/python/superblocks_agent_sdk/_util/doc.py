from dataclasses import fields
from typing import Optional, Type


def modify_pdoc(
    *,
    dataclass: Optional[Type] = None,
    existing_pdoc: Optional[dict] = None,
    exclude: Optional[list[str]] = None,
) -> dict:
    """
    Returns a cleaned up __pdoc__ for generating docs.
    """
    exclude = exclude or []
    docs = existing_pdoc or {}
    if dataclass is not None:
        # this prevents dataclass fields from being displayed twice: 1. from docstring, 2. as "class variables"
        docs.update(
            {f"{dataclass.__name__}.{field.name}": False for field in fields(dataclass)}
        )

    # exclude things by name
    for e in exclude:
        docs[e] = False
    return docs
