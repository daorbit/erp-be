import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from './errorHandler.js';
import { UserRole } from '../shared/types.js';
import User from '../modules/auth/auth.model.js';

// Roles exempt from onboarding gate — they manage others' onboarding
const ONBOARDING_EXEMPT_ROLES: string[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER];

/**
 * Blocks access for users who require onboarding but haven't completed it.
 * Admin and HR Manager roles are exempt — they don't need onboarding.
 * Must be used after `authenticate`.
 */
export const requireOnboardingComplete: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    next();
    return;
  }

  // Admin roles are exempt from onboarding
  if (ONBOARDING_EXEMPT_ROLES.includes(req.user.role)) {
    next();
    return;
  }

  const user = await User.findById(req.user.id)
    .select('onboardingRequired onboardingCompleted')
    .lean();

  if (user?.onboardingRequired && !user?.onboardingCompleted) {
    next(new AppError('Onboarding is required. Please complete your onboarding to continue.', 428));
    return;
  }

  next();
};
