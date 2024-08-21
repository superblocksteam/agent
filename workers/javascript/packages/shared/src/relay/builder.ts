import { Relay } from './index';

export class RelayBuilder {
  private relay: Relay;

  constructor() {
    this.relay = { headers: [], query: [], body: [] };
  }

  public build(): Relay {
    return this.relay;
  }

  /**
   * Relay a request header using a different name.
   * Header relay rules aren't case-sensitive because http headers aren't case sensitive.
   * @param from The name of the request header to relay from the incoming request.
   * @param to   The new name of the request header to relay to the outgoing request.
   */
  public relayHeaderRename(from: string, to: string): RelayBuilder {
    this.relay.headers.push({ [from.toLowerCase()]: to.toLowerCase() });
    return this;
  }

  /**
   * Relay request headers using the same names.
   * @param from The names of the incoming request headers to relay from.
   *
   * Header relay rules aren't case-sensitive because http headers aren't case sensitive.
   */
  public relayHeaders(from: string[]): RelayBuilder {
    this.relay.headers.push(...from);
    return this;
  }

  /**
   * Relay a request query parameter using a different name.
   * @param from The name of the request query parameter to relay from the incoming request.
   * @param to   The new name of the request query parameter to relay to the outgoing request.
   */
  public relayQueryRename(from: string, to: string): RelayBuilder {
    this.relay.query.push({ [from]: to });
    return this;
  }

  /**
   * Relay request query parameters using the same names.
   * @param from The names of the incoming request query parameters to relay from.
   */
  public relayQuery(from: string[]): RelayBuilder {
    this.relay.query.push(...from);
    return this;
  }

  /**
   * Relay request a query body field using a different name.
   * @param from The name of the request body field to relay from the incoming request.
   * @param to   The new name of the request body field to relay to the outgoing request.
   */
  public relayBodyRename(from: string, to: string): RelayBuilder {
    this.relay.body.push({ [from]: to });
    return this;
  }

  /**
   * Relay query body fields using the same names.
   * @param from: The names of the incoming request body fields to relay from.
   */
  public relayBody(from: string[]): RelayBuilder {
    this.relay.body.push(...from);
    return this;
  }
}

export function relayBuilder(): RelayBuilder {
  return new RelayBuilder();
}
