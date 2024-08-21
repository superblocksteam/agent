from prometheus_client import Counter

namespace = "worker_python_"

busy_seconds_counter = Counter(
    f"{namespace}busy_seconds", "Amount of time worker is actively processing a job."
)
