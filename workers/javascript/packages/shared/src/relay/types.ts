export type RelayRules = (string | Record<string, string>)[];

export interface Relay {
  headers: RelayRules;
  query: RelayRules;
  body: RelayRules;
}

export const NO_RELAY: Relay = { headers: [], body: [], query: [] };

export const RELAY_BODY_FIELD_NAME = 'relays';
