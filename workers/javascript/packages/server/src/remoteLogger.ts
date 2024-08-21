import { StructuredLog } from '@superblocks/shared';
import { SUPERBLOCKS_CONTROLLER_KEY, SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE, SUPERBLOCKS_WORKER_ID } from './env';

const constructLog = (message: string, fields: Record<string, string>) => {
  const log = {
    message,
    ts: Date.now(),
    component: 'worker.js',
    ...fields
  };
  return log;
};

// TODO: batch logs with a buffer
const remoteLog = (logs: Array<StructuredLog>, fields: Record<string, string>) => {
  const body = { logs: [] };
  const headers = {
    'content-type': 'application/json',
    'x-superblocks-agent-key': SUPERBLOCKS_CONTROLLER_KEY,
    'x-superblocks-agent-id': SUPERBLOCKS_WORKER_ID
  };

  for (const log of logs) {
    body.logs.push(constructLog(log.msg, { remote: 'true', level: log.level, ...fields }));
  }

  void fetch(SUPERBLOCKS_ORCHESTRATOR_EMITTER_REMOTE_INTAKE, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
};

export const remoteLogStructured = (logs: Array<StructuredLog>, fields: Record<string, string>) => {
  if (logs.length > 0) {
    remoteLog(logs, fields);
  }
};

export const remoteInfo = (messages: Array<string>, fields: Record<string, string>) => {
  remoteLog(
    messages.map((msg) => ({ msg, level: 'info' })),
    fields
  );
};

export const remoteError = (messages: Array<string>, fields: Record<string, string>) => {
  remoteLog(
    messages.map((msg) => ({ msg, level: 'error' })),
    fields
  );
};
