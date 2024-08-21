from pathlib import Path

import log
from constants import SUPERBLOCKS_WORKER_HEALTHY_PATH


def mark_worker_healthy() -> None:
    try:
        health_file = Path(SUPERBLOCKS_WORKER_HEALTHY_PATH)
        if not health_file.exists():
            with health_file.open(mode="w") as f:
                f.write("OK")
    except Exception as e:
        log.error("error writing health file", error=str(e))


def mark_worker_unhealthy() -> None:
    try:
        Path(SUPERBLOCKS_WORKER_HEALTHY_PATH).unlink(missing_ok=True)
    except Exception as e:
        log.error("could not remove healthy file", error=str(e))
