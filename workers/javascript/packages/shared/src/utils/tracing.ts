import { Context, propagation } from '@opentelemetry/api';

export function getTagsFromContext(context: Context): Record<string, string> {
  const baggage = propagation.getBaggage(context);
  const tags = {};
  baggage?.getAllEntries().forEach((value) => {
    tags[value[0]] = value[1].value;
  });
  return tags;
}
