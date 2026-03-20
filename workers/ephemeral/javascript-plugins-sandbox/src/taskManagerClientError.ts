import * as grpc from '@grpc/grpc-js';

export type TaskManagerSubsystem = 'integration-executor' | 'streaming-proxy' | 'variable-store';

/**
 * Thrown when a gRPC or HTTP call from the sandbox to task-manager fails.
 */
export class TaskManagerClientError extends Error {
  public override readonly cause?: Error;

  public constructor(
    public readonly subsystem: TaskManagerSubsystem,
    cause: unknown
  ) {
    const detail = TaskManagerClientError.formatCause(cause);
    super(`${subsystem}: ${detail}`);
    this.name = 'TaskManagerClientError';
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }

  private static formatCause(cause: unknown): string {
    if (cause instanceof Error) {
      return cause.message;
    }
    return String(cause);
  }
}

/**
 * True for @grpc/grpc-js client callback errors (StatusObject & Error).
 * Excludes IntegrationError and TaskManagerClientError so they are not mistaken for transport errors.
 */
export function isGrpcServiceError(error: unknown): error is grpc.ServiceError {
  if (!(error instanceof Error)) {
    return false;
  }
  if (error.name === 'IntegrationError' || error.name === 'TaskManagerClientError') {
    return false;
  }
  const candidate = error as grpc.ServiceError;
  return typeof candidate.code === 'number' && typeof candidate.details === 'string' && candidate.metadata != null;
}

/** Variable-store (and other) gRPC failures that must propagate as PermissionDenied, not INTERNAL. */
export function isGrpcPermissionDenied(error: unknown): error is grpc.ServiceError {
  return isGrpcServiceError(error) && error.code === grpc.status.PERMISSION_DENIED;
}
