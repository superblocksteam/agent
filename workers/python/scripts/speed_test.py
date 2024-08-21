import statistics
import sys
import time
from functools import partial
from typing import Callable

import requests

__ENVS_AND_WORKFLOW_LINKS = {
    "prod": "https://app.superblocks.com/agent/v1/workflows/ccf30e29-6ed0-4108-8b75-66e61ec039fa?environment=production",  # noqa: E501
    "staging": "https://staging.superblocks.com/agent/v1/workflows/2af5ca0f-7c48-4185-b98c-2beb3e161c1a?environment=production",  # noqa: E501
}


def time_func(*, func: Callable, iterations: int) -> list[float]:
    """
    returns all runtimes
    """
    runtimes = []
    for i in range(iterations):
        start_time = time.time()
        func()
        end_time = time.time()
        runtimes.append(end_time - start_time)
        run_num = i + 1
        if run_num % 10 == 0:
            print(f"{run_num} / {iterations}")
            print(f"AVERAGE RUNTIME MS: {statistics.mean(runtimes)}")
            print(f"MEDIAN RUNTIME MS : {statistics.median(runtimes)}")
            print(f"MAX RUNTIME MS    : {max(runtimes)}")
            print(f"MIN RUNTIME MS    : {min(runtimes)}")
    return runtimes


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(
            "NEED PARAMS: 1. ENV NAME, 2. ITERATION COUNT, 3. MAX MEDIAN RUNTIME MS, 4. MAX MEAN RUNTIME MS"
        )
        exit(1)
    env = sys.argv[1]
    iterations = int(sys.argv[2])
    url = __ENVS_AND_WORKFLOW_LINKS.get(env, None)
    if url is None:
        print(f"invalid env {env}, choose one of {__ENVS_AND_WORKFLOW_LINKS.keys()}")

    max_median_runtime_ms = float(sys.argv[3])
    max_mean_runtime_ms = float(sys.argv[4])

    runtimes = time_func(
        func=partial(requests.post, url),
        iterations=iterations,
    )
    median_runtime = statistics.median(runtimes)
    mean_runtime = statistics.mean(runtimes)

    print("\n\nFINAL RESULTS")
    print(f"MEDIAN RUNTIME: {median_runtime}")
    print(f"MEAN RUNTIME: {mean_runtime}\n")

    error = False
    if median_runtime > max_median_runtime_ms:
        print(f"MEDIAN THRESHOLD EXCEEDED BY {median_runtime - max_median_runtime_ms}")
        error = True
    if mean_runtime > max_mean_runtime_ms:
        print(f"MEAN THRESHOLD EXCEEDED BY {mean_runtime - max_mean_runtime_ms}")
        error = True
    if error:
        print("FAILED")
        exit(1)
    print("SUCCEEDED")
