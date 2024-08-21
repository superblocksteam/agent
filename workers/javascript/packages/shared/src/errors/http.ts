export class HttpError extends Error {
  status: number;
  message: string;
  title?: string;
  constructor(status: number, message: string, title?: string) {
    super(message);
    this.status = status;
    this.message = message;
    this.title = title;
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message, 'Bad request');
  }
}

// We should use UnauthorizedError defined in packages/server
export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message, 'Unauthorized');
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(403, message, 'Forbidden');
  }
}

export class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(404, message || 'Resource not found', 'Not found');
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string) {
    super(500, message, 'Internal server error');
  }
}

export class NotImplementedError extends HttpError {
  constructor(message: string) {
    super(501, message, 'Not implemented');
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string) {
    super(429, message, 'Too many requests');
  }
}

// to differenciate from other UnauthorizedError returned from agent
export class RbacUnauthorizedError extends UnauthorizedError {
  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message, 'Conflict occurred.');
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message?: string) {
    super(405, message || 'Method Not Allowed', 'Method Not Allowed');
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message?: string) {
    super(503, message || 'Service Unavailable', 'Service Unavailable');
  }
}

export const NON_SB_ORG_UPDATE_ERROR = 'Superblocks user cannot update non-Superblocks organization without explicit flag.';
