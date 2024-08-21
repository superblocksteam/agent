import asyncio
from signal import SIGINT, SIGTERM, Signals

import log
from health import mark_worker_unhealthy

from transport.transport import Transport


def attach_signal_handlers(transport: Transport, loop: asyncio.AbstractEventLoop):
    for sig in (SIGINT, SIGTERM):

        def signal_handler():
            log.info("received signal", signal=Signals(sig).name)

            async def shutdown():
                if transport:
                    log.info("closing transport")
                    await transport.close("signal shutdown")
                    loop.stop()

            loop.create_task(shutdown())
            mark_worker_unhealthy()

        loop.add_signal_handler(sig, signal_handler)


def remove_signal_handlers(loop: asyncio.AbstractEventLoop):
    for sig in (SIGINT, SIGTERM):
        loop.remove_signal_handler(sig)
