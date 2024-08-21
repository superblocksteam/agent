import { SnowflakeError } from './SnowflakeError';

export class StatementNotExecutedError extends SnowflakeError {
  constructor() {
    super('Statement not executed yet - call the execute() method');
  }
}
