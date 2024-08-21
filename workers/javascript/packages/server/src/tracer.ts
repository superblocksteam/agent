import { Baggage, ROOT_CONTEXT, Tracer, defaultTextMapGetter, propagation, trace } from '@opentelemetry/api';
import { W3CBaggagePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { AGENT_KEY_HEADER, EnvStore, OBS_TAG_WORKER_ID, buildSuperblocksDomainURL } from '@superblocks/shared';
import dotenv from 'dotenv';
import {
  SUPERBLOCKS_AGENT_BUCKET,
  SUPERBLOCKS_AGENT_DOMAIN,
  SUPERBLOCKS_CONTROLLER_KEY,
  SUPERBLOCKS_WORKER_ID,
  SUPERBLOCKS_WORKER_VERSION
} from './env';

dotenv.config();

const envs = new EnvStore(process.env);
const serviceName = 'worker.js'; // NOTE(frank): This seems to take precedence despite the value of DD_SERVICE

envs.addAll([
  {
    name: '__SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE',
    defaultValue: 'true'
  },
  {
    name: '__SUPERBLOCKS_AGENT_INTAKE_TRACES_SCHEME',
    defaultValue: 'https'
  },
  {
    name: '__SUPERBLOCKS_AGENT_INTAKE_TRACES_HOST',
    defaultValue: ''
  },
  {
    name: '__SUPERBLOCKS_AGENT_INTAKE_TRACES_PORT',
    defaultValue: '443'
  },
  {
    name: '__SUPERBLOCKS_AGENT_INTAKE_TRACES_PATH',
    defaultValue: ''
  }
]);

const provider = new NodeTracerProvider({
  resource: Resource.default().merge(
    new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: SUPERBLOCKS_WORKER_VERSION,
      [OBS_TAG_WORKER_ID]: SUPERBLOCKS_WORKER_ID,
      ['worker-bucket']: SUPERBLOCKS_AGENT_BUCKET // TODO(frank): Add to formal observability tags.
    })
  )
});

provider.addSpanProcessor(
  envs.get('__SUPERBLOCKS_AGENT_INTAKE_TRACES_ENABLE') !== 'true'
    ? new SimpleSpanProcessor(new OTLPTraceExporter())
    : new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: buildSuperblocksDomainURL({
            domain: SUPERBLOCKS_AGENT_DOMAIN,
            subdomain: 'traces.intake',
            scheme: envs.get('__SUPERBLOCKS_AGENT_INTAKE_TRACES_SCHEME'),
            port: envs.get('__SUPERBLOCKS_AGENT_INTAKE_TRACES_PORT'),
            path: envs.get('__SUPERBLOCKS_AGENT_INTAKE_TRACES_PATH'),
            hostOverride: envs.get('__SUPERBLOCKS_AGENT_INTAKE_TRACES_HOST')
          }),
          headers: {
            [AGENT_KEY_HEADER]: SUPERBLOCKS_CONTROLLER_KEY
          }
        }),
        {} // tune batch options here
      )
);

provider.register({
  propagator: new W3CTraceContextPropagator()
});

export const OBS_CORRELATION_ID_TAG = 'correlation-id';

export function getTracer(): Tracer {
  return trace.getTracer(serviceName, SUPERBLOCKS_WORKER_VERSION);
}

export const baggagePropagator = new W3CBaggagePropagator();

export const getBaggageAsObjFromCarrier = (carrier: Record<string, string>): Record<string, string> => {
  const baggageContext = baggagePropagator.extract(ROOT_CONTEXT, carrier, defaultTextMapGetter);
  const baggage = propagation.getBaggage(baggageContext);
  let baggageAsObj = {};
  if (baggage) {
    baggageAsObj = baggageToObject(baggage);
  }

  return baggageAsObj;
};

const baggageToObject = (baggage: Baggage): Record<string, string> => {
  const baggageObject = {};
  for (const [key, value] of baggage.getAllEntries()) {
    baggageObject[key] = value.value;
  }
  return baggageObject;
};

export default provider;
