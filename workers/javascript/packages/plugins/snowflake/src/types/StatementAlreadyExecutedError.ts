import { SnowflakeError } from './SnowflakeError';

export class StatementAlreadyExecutedError extends SnowflakeError {
  constructor() {
    super('Statement already executed - it cannot be executed again');
  }
}
