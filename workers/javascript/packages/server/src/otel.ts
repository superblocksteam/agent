import { Span, Context, trace, propagation, context, BaggageEntry } from '@opentelemetry/api';

// https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/opentelemetry/?tab=nodejs
export function otelSpanContextToDataDog(ctx: Context): Record<string, string> {
  const span: Span | undefined = trace.getSpan(ctx);
  if (!span) {
    return {};
  }

  const logAttributes = getTraceTagsFromContext(ctx);
  const { spanId, traceId } = span.spanContext();
  const traceIdEnd = traceId.slice(traceId.length / 2);

  return {
    ...logAttributes,
    'dd.trace_id': BigInt(`0x${traceIdEnd}`).toString(),
    'dd.span_id': BigInt(`0x${spanId}`).toString()
  };
}

export function getTraceTagsFromContext(context: Context): Record<string, string> {
  const baggage = propagation.getBaggage(context);
  const traceTags = {};
  baggage?.getAllEntries().forEach((value) => {
    traceTags[value[0]] = value[1].value;
  });
  return traceTags;
}

export function getTraceTagsFromActiveContext(): Record<string, string> {
  return getTraceTagsFromContext(context.active());
}

export function getBaggageFromObject(obj: Record<string, string>): Record<string, BaggageEntry> {
  const baggageEntries = {};
  Object.entries(obj).forEach((value) => {
    baggageEntries[value[0]] = { value: value[1] as string };
  });
  return baggageEntries;
}
