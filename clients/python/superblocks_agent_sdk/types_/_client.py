from typing import Callable, Optional

GenericTwoWayStreamResponse = object
GenericTwoWayStreamRequest = object
GenericMetadata = object
TwoWayStreamResponseHandler = Callable[
    [GenericTwoWayStreamResponse],
    tuple[Optional[GenericTwoWayStreamRequest], Optional[GenericMetadata]],
]
