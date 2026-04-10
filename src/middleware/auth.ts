import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { UserRole } from '../shared/types.js';
import { AppError } from './errorHandler.js';
import User from '../modules/auth/auth.model.js';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  company?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authenticate a request by verifying the JWT in the Authorization header.
 * Checks that the user still exists and is active in the database.
 * Attaches the decoded user payload to `req.user`.
 */
export const authenticate: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Verify user still exists, is active, and check onboarding status
    const user = await User.findById(decoded.id)
      .select('isActive onboardingRequired onboardingCompleted')
      .lean();
    if (!user) {
      throw new AppError('User no longer exists. Please log in again.', 401);
    }
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      company: decoded.company || undefined,
      onboardingRequired: user.onboardingRequired,
      onboardingCompleted: user.onboardingCompleted,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token has expired. Please log in again.', 401));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token. Please log in again.', 401));
      return;
    }
    next(new AppError('Authentication failed.', 401));
  }
};

/**
 * Authorize access based on user roles.
 * Must be used after `authenticate`.
 */
export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required before authorization.', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          'You do not have permission to perform this action.',
          403,
        ),
      );
      return;
    }

    next();
  };
}
