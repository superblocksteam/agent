import * as grpc from '@grpc/grpc-js';
import { describe, expect, it } from '@jest/globals';
import { IntegrationError } from '@superblocks/shared';
import { isGrpcPermissionDenied, isGrpcServiceError, TaskManagerClientError } from './taskManagerClientError';

describe('TaskManagerClientError', () => {
  it('wraps a cause message under a subsystem prefix', () => {
    const err = new TaskManagerClientError('variable-store', new Error('connection refused'));
    expect(err.message).toBe('variable-store: connection refused');
    expect(err.subsystem).toBe('variable-store');
    expect(err.cause?.message).toBe('connection refused');
  });
});

describe('isGrpcServiceError', () => {
  it('returns true for grpc-js ServiceError shape', () => {
    const meta = new grpc.Metadata();
    const err = Object.assign(new Error('3 INVALID_ARGUMENT: bad'), {
      code: grpc.status.INVALID_ARGUMENT,
      details: 'bad',
      metadata: meta
    });
    expect(isGrpcServiceError(err)).toBe(true);
  });

  it('returns false for IntegrationError', () => {
    const err = new IntegrationError('user mistake');
    expect(isGrpcServiceError(err)).toBe(false);
  });

  it('returns false for TaskManagerClientError', () => {
    const err = new TaskManagerClientError('streaming-proxy', new Error('boom'));
    expect(isGrpcServiceError(err)).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(isGrpcServiceError(new Error('plain'))).toBe(false);
  });
});

describe('isGrpcPermissionDenied', () => {
  it('returns true when code is PERMISSION_DENIED', () => {
    const meta = new grpc.Metadata();
    const err = Object.assign(new Error('7 PERMISSION_DENIED: blocked'), {
      code: grpc.status.PERMISSION_DENIED,
      details: 'blocked',
      metadata: meta
    });
    expect(isGrpcPermissionDenied(err)).toBe(true);
  });

  it('returns false for other gRPC codes', () => {
    const meta = new grpc.Metadata();
    const err = Object.assign(new Error('14 UNAVAILABLE: x'), {
      code: grpc.status.UNAVAILABLE,
      details: 'x',
      metadata: meta
    });
    expect(isGrpcPermissionDenied(err)).toBe(false);
  });
});
