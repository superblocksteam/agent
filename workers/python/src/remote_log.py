from typing import List

from requests_futures.sessions import FuturesSession

from constants import (
    SUPERBLOCKS_AGENT_KEY,
    SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE,
    SUPERBLOCKS_WORKER_ID,
)
from log import construct_json_msg, error

session = FuturesSession()


# TODO: implement batching and timed flush
def remote_log(messages: List[str], level: str, **kwargs) -> None:
    body: dict = {"logs": []}
    headers = {
        "content-type": "application/json",
        "x-superblocks-agent-key": SUPERBLOCKS_AGENT_KEY,
        "x-superblocks-agent-id": SUPERBLOCKS_WORKER_ID,
    }

    for message in messages:
        body["logs"].append(
            construct_json_msg(message, level=level, remote="true", **kwargs)
        )

    try:
        session.post(
            SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE, headers=headers, json=body
        )
    except Exception as e:
        error(f"Failed to send logs to remote intake: {e}")


def remote_info(messages: List[str], **kwargs) -> None:
    remote_log(messages, "info", **kwargs)


def remote_error(messages: List[str], **kwargs) -> None:
    remote_log(messages, "error", **kwargs)
