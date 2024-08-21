from typing import Optional

from constants import (
    AGENT_KEY_HEADER,
    SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE,
    SUPERBLOCKS_AGENT_INTAKE_TRACES_URL,
    SUPERBLOCKS_AGENT_KEY,
    SUPERBLOCKS_WORKER_VERSION,
)
from log import debug, info
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor

SERVICE_NAME = "worker.py"


def init_otel() -> None:
    info("configuring otel...")

    span_processor: Optional[SimpleSpanProcessor | BatchSpanProcessor] = None

    if SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE:
        debug("traces are enabled")
        span_processor = BatchSpanProcessor(
            OTLPSpanExporter(
                endpoint=SUPERBLOCKS_AGENT_INTAKE_TRACES_URL,
                headers=[(AGENT_KEY_HEADER, SUPERBLOCKS_AGENT_KEY)],
            )
        )
    else:
        debug("traces are disabled")
        span_processor = SimpleSpanProcessor(OTLPSpanExporter())

    resource = Resource(attributes={"service.name": SERVICE_NAME})
    trace_provider = TracerProvider(resource=resource)
    trace_provider.add_span_processor(span_processor)
    trace.set_tracer_provider(trace_provider)


def get_tracer():
    tracer = trace.get_tracer(SERVICE_NAME, SUPERBLOCKS_WORKER_VERSION)
    debug(f"got tracer: {tracer.__dict__}")
    debug(f"got span processer: {tracer.span_processor.__dict__}")
    return tracer
