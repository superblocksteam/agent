export class AgentCredentials {
  jwt?: string;
  apiKey?: string;

  constructor({ jwt = '', apiKey = '' }: { jwt?: string; apiKey?: string }) {
    this.jwt = jwt;
    this.apiKey = apiKey;
  }
}

export function makeBasicAuthToken(username: string, password: string): string {
  return Buffer.from(username + ':' + password).toString('base64');
}
