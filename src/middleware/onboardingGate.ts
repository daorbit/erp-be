import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from './errorHandler.js';
import { UserRole } from '../shared/types.js';

// Roles exempt from onboarding gate — they manage others' onboarding
const ONBOARDING_EXEMPT_ROLES: string[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER];

/**
 * Blocks access for users who require onboarding but haven't completed it.
 * Reads onboarding status from req.user (set by auth middleware — no extra DB query).
 * Admin and HR Manager roles are exempt.
 * Must be used after `authenticate`.
 */
export const requireOnboardingComplete: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next();
    return;
  }

  // Admin roles are exempt from onboarding
  if (ONBOARDING_EXEMPT_ROLES.includes(req.user.role)) {
    next();
    return;
  }

  if (req.user.onboardingRequired && !req.user.onboardingCompleted) {
    next(new AppError('Onboarding is required. Please complete your onboarding to continue.', 428));
    return;
  }

  next();
};
