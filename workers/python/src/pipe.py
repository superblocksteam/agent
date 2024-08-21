import os
import pickle
from asyncio import StreamReader, StreamReaderProtocol, get_event_loop
from typing import Any, List

from utils import decode_bytes_to_int, encode_int_to_bytes

DATA_SIZE_BYTES = 8


def publish(fd: int, payload: Any) -> None:
    payload_bytes = pickle.dumps(payload)
    length = len(payload_bytes)
    length_bytes = encode_int_to_bytes(length)
    os.write(fd, length_bytes + payload_bytes)


async def receiveAll(reader: int, consumer=None, read_once=False) -> List[str]:
    """Receives data from a pipe without blocking the main thread."""
    chunk_size = 2**16  # 64KB

    stream_reader: StreamReader = StreamReader(limit=chunk_size)

    transport, _ = await get_event_loop().connect_read_pipe(
        lambda: StreamReaderProtocol(stream_reader), os.fdopen(reader, mode="r")
    )
    result: List[str] = []

    async def _read_payload(_head: bytes):
        payload_bytes = decode_bytes_to_int(_head)

        read_bytes = 0
        data = bytearray()
        while read_bytes < payload_bytes:
            bytesToRead = min(payload_bytes - read_bytes, chunk_size)
            chunk = await stream_reader.read(bytesToRead)
            data += chunk
            read_bytes += len(chunk)

        if data:
            if consumer:
                await consumer(data)
            result.append(pickle.loads(data))

    if read_once:
        head = await stream_reader.read(DATA_SIZE_BYTES)
        if head:
            await _read_payload(head)
    else:
        while head := await stream_reader.read(DATA_SIZE_BYTES):
            await _read_payload(head)

    if transport is not None:
        transport.close()
    return result
