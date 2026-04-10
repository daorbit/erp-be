import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../shared/types.js';
import { AppError } from './errorHandler.js';

/**
 * Ensures that non-super_admin users have a company association.
 * Must be used after `authenticate`.
 */
export const requireCompany: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new AppError('Authentication required.', 401));
    return;
  }

  if (req.user.role !== UserRole.SUPER_ADMIN && !req.user.company) {
    next(new AppError('Company association required. Please contact an administrator.', 403));
    return;
  }

  next();
};
