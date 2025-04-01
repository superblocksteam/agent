from asyncio import run
from multiprocessing import set_start_method
from uuid import uuid4

import nest_asyncio  # type: ignore
from prometheus_client import start_http_server

from constants import (
    SUPERBLOCKS_AGENT_REDIS_HOST,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN,
    SUPERBLOCKS_AGENT_REDIS_PORT,
    SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE,
    SUPERBLOCKS_AGENT_REDIS_SOCKET_TIMEOUT_SECONDS,
    SUPERBLOCKS_AGENT_REDIS_TOKEN,
    SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS,
    SUPERBLOCKS_AGENT_TLS_INSECURE,
    SUPERBLOCKS_METRICS_BIND_ADDRESS,
    SUPERBLOCKS_METRICS_PORT,
    SUPERBLOCKS_SLIM_IMAGE,
)
from otel import init_otel

# FREE SPEED!
if not SUPERBLOCKS_SLIM_IMAGE:
    import speed  # noqa

from kvstore.kvstore import KVStore
from kvstore.redis import RedisKVStore
from log import error, info
from transport.redis import RedisTransport
from transport.transport import Transport

nest_asyncio.apply()


def run_transport_forever(transport: Transport) -> None:
    try:
        info("starting transport")
        run(transport.init())
    except Exception as e:
        error(f"fatal worker crash, {str(e)}")


def get_kvstore() -> KVStore:
    redis_options = {
        "client_name": f"kv_{uuid4()}",
        "host": SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST,
        "port": SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT,
        "ssl": not SUPERBLOCKS_AGENT_TLS_INSECURE,
        "socket_timeout": SUPERBLOCKS_AGENT_REDIS_SOCKET_TIMEOUT_SECONDS,
    }

    if SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN:
        redis_options["password"] = SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN

    return RedisKVStore(
        redis_options=redis_options,
        key_retention_seconds=SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS,
    )


def get_transport(kvstore: KVStore) -> Transport:
    redis_options = {
        "client_name": f"queue_{uuid4()}",
        "host": SUPERBLOCKS_AGENT_REDIS_HOST,
        "port": SUPERBLOCKS_AGENT_REDIS_PORT,
        "ssl": not SUPERBLOCKS_AGENT_TLS_INSECURE,
    }

    if SUPERBLOCKS_AGENT_REDIS_TOKEN:
        redis_options["password"] = SUPERBLOCKS_AGENT_REDIS_TOKEN

    return RedisTransport(
        kv_store=kvstore,
        redis_options=redis_options,
        batch=SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE,
    )


if __name__ == "__main__":
    # Here's a warning from the stdlib docs
    #
    # Changed in version 3.8: On macOS, the spawn start method is now the default.
    # The fork start method should be considered unsafe as it can lead to crashes of the subprocess. See bpo-33725.
    #
    # I have personally never run into this. We obviously don't want spawn in production
    # as it's very slow. We could change the method based on OS but fork has worked fine so far.
    set_start_method("fork")

    # Start prometheus metrics server
    prom_server = None
    try:
        prom_server, _ = start_http_server(
            SUPERBLOCKS_METRICS_PORT, SUPERBLOCKS_METRICS_BIND_ADDRESS
        )

        init_otel()

        kvstore = get_kvstore()
        transport = get_transport(kvstore)

        run_transport_forever(transport)
    finally:
        if prom_server is not None:
            prom_server.shutdown()
            prom_server.server_close()
