import { NotFoundError } from './http';

export class FileNotFound extends NotFoundError {
  constructor(message: string) {
    super(message);
  }
}

export class RepositoryFoundError extends NotFoundError {
  constructor(message: string) {
    super(message);
  }
}
