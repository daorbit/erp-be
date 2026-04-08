import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import config from '../config/index.js';
import { buildErrorResponse } from '../shared/helpers.js';

// ─── AppError ────────────────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Async Handler ───────────────────────────────────────────────────────────

/**
 * Wraps an async route handler so that rejected promises are forwarded to
 * Express's `next()` automatically.
 *
 * The generic parameter allows callers to narrow the Request type
 * (e.g. `IAuthRequest`) while remaining compatible with Express routing.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<void | Response>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}

// ─── Global Error Handler ────────────────────────────────────────────────────

function handleMongooseDuplicateKey(err: Record<string, unknown>): AppError {
  const keyValue = err['keyValue'] as Record<string, unknown> | undefined;
  const field = keyValue ? Object.keys(keyValue).join(', ') : 'field';
  return new AppError(
    `Duplicate value for ${field}. Please use a different value.`,
    409,
  );
}

function handleMongooseValidationError(err: Record<string, unknown>): AppError {
  const errors = err['errors'] as Record<string, { message: string }> | undefined;
  const messages = errors
    ? Object.values(errors).map((e) => e.message)
    : ['Validation failed'];
  return new AppError(messages.join('. '), 400);
}

function handleMongooseCastError(err: Record<string, unknown>): AppError {
  const path = err['path'] as string | undefined;
  const value = err['value'] as unknown;
  return new AppError(`Invalid value "${String(value)}" for ${path ?? 'field'}`, 400);
}

export const globalErrorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // Mongoose / Mongo specific errors
    const anyErr = err as Record<string, unknown>;
    const errName = anyErr['name'] as string | undefined;
    const errCode = anyErr['code'] as number | undefined;

    if (errCode === 11000) {
      const converted = handleMongooseDuplicateKey(anyErr);
      statusCode = converted.statusCode;
      message = converted.message;
    } else if (errName === 'ValidationError') {
      const converted = handleMongooseValidationError(anyErr);
      statusCode = converted.statusCode;
      message = converted.message;
    } else if (errName === 'CastError') {
      const converted = handleMongooseCastError(anyErr);
      statusCode = converted.statusCode;
      message = converted.message;
    } else {
      message = config.server.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message || message;
    }
  }

  // Log non-operational errors (programming bugs)
  if (!(err instanceof AppError) || !err.isOperational) {
    console.error('[ERROR]', err);
  }

  const body = buildErrorResponse(message, errors);
  res.status(statusCode).json(body);
};
