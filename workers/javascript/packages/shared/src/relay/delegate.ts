import { Request } from 'express';
import { Relay, RELAY_BODY_FIELD_NAME, RelayRules } from './types';

/**
 * RelayDelegate constructs and adds relayed payloads for Agent -> Server request.
 *
 * See {@link Relay}
 */
export class RelayDelegate {
  private relay: Relay;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private incomingHeaders: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private incomingQuery: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private incomingBody: Record<string, any>;

  constructor(incomingRequest: Request) {
    this.relay = incomingRequest.body[RELAY_BODY_FIELD_NAME] as Relay;
    // incomingHeaders are always lower-cased.
    this.incomingHeaders = incomingRequest.headers;
    this.incomingQuery = incomingRequest.query;
    this.incomingBody = incomingRequest.body;
  }

  /**
   * Construct and add headers relayed from the incoming request headers.
   * @param outgoingHeaders We add relayed headers to outgoingHeaders.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public relayHeaders(outgoingHeaders: Record<string, any>): Record<string, any> {
    return relayFields(this.relay.headers, this.incomingHeaders, outgoingHeaders, false);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public relayQuery(outgoingQuery: Record<string, any>): Record<string, any> {
    return relayFields(this.relay.query, this.incomingQuery, outgoingQuery);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public relayBody(outgoingBody: Record<string, any>): Record<string, any> {
    return relayFields(this.relay.body, this.incomingBody, outgoingBody);
  }
}

export function relayDelegateFromRequest(incomingRequest: Request): RelayDelegate | null {
  if (!incomingRequest.body[RELAY_BODY_FIELD_NAME]) {
    return null;
  } else {
    return new RelayDelegate(incomingRequest);
  }
}

function relayFields(
  relayRules: RelayRules,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incomingFields: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outgoingFields: Record<string, any>,
  caseSensitive = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const relayedOutgoingFields = { ...outgoingFields };
  for (const relayRule of relayRules) {
    let relayFrom = '';
    let relayTo = '';
    if (typeof relayRule === 'string') {
      // Relay to the same name
      relayFrom = relayRule;
      relayTo = relayRule;
    } else if (typeof relayRule === 'object') {
      // Relay to a different name
      Object.keys(relayRule as Record<string, string>).forEach((key) => {
        relayFrom = key;
        relayTo = relayRule[key];
      });
    } else {
      continue;
    }

    if (!caseSensitive) {
      relayFrom = relayFrom.toLowerCase();
    }
    // We can't have undefined in the request
    if (incomingFields[relayFrom] !== undefined) {
      relayedOutgoingFields[relayTo] = incomingFields[relayFrom];
    }
  }

  return relayedOutgoingFields;
}
