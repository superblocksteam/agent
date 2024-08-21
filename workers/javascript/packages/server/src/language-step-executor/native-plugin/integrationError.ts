// Integration errors are external errors to Superblocks and thrown from API execution
export class IntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationError';
  }
}
