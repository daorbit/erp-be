import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../config/index.js';
import { UserRole, UserType } from '../shared/types.js';
import { AppError } from './errorHandler.js';
import User from '../modules/auth/auth.model.js';
import Company from '../modules/companies/company.model.js';
import { CompanyService } from '../modules/companies/company.service.js';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  userType?: UserType;
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

    // Verify user still exists, is active, and pull scope arrays.
    // userType / allowedModules / allowedSites are fetched fresh from the DB
    // rather than baked into the JWT so admin scope changes take effect on the
    // next request without forcing re-login.
    const user = await User.findById(decoded.id)
      .select(
        'isActive onboardingRequired onboardingCompleted allowedCompanies '
        + 'userType allowedModules allowedBranches',
      )
      .lean();
    if (!user) {
      throw new AppError('User no longer exists. Please log in again.', 401);
    }
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact an administrator.', 403);
    }

    // Resolve effective scope arrays BEFORE the X-Active-Company check so
    // the switcher validation uses the same allowedCompanies list as data
    // queries downstream.
    const userType = (user.userType as UserType | undefined) ?? decoded.userType;
    let allowedCompanies = (user.allowedCompanies ?? []).map((id: any) => id.toString());

    // For company-level super_admin (userType=super_admin with a company,
    // or the legacy role=super_admin with a company for users that pre-date
    // the userType field), resolve allowedCompanies live to the entire
    // parent group on every request. This way newly-created sibling
    // companies become visible immediately without needing to re-issue the
    // JWT or manually update the user's record.
    const isCompanyLevelSuperAdmin = !!decoded.company
      && (userType === UserType.SUPER_ADMIN || decoded.role === UserRole.SUPER_ADMIN);
    if (isCompanyLevelSuperAdmin) {
      try {
        const group = await CompanyService.getGroupCompanies(decoded.company);
        allowedCompanies = group.map((c: any) => c._id?.toString() ?? String(c._id));
      } catch {
        // Fall back to the stored snapshot if group resolution fails —
        // a stale list is better than 403'ing the whole request.
      }
    }

    // Resolve the active company from the X-Active-Company header.
    // The requested company must be the user's own company, or explicitly listed
    // in allowedCompanies (grant-based cross-company access).
    //
    // If the header is present but invalid for this user (stale value left
    // over from a previous session, a company they no longer have access to,
    // a deactivated company), we silently fall back to the user's primary
    // company rather than throwing — the user's session is still valid, and
    // failing every request with a hard 403 leaves the UI stuck in a broken
    // state with no way to recover. The frontend's CompanySwitcher will
    // reconcile its local state on next group fetch.
    const requestedCompanyId = req.headers['x-active-company'] as string | undefined;
    let activeCompany: string | undefined = decoded.company || undefined;

    if (requestedCompanyId && requestedCompanyId !== decoded.company) {
      const isValidId = mongoose.Types.ObjectId.isValid(requestedCompanyId);
      // Platform super_admin (no company) bypasses; otherwise check against
      // the live-resolved allowedCompanies (which for company-level super_admin
      // already includes every sibling in the group).
      const isAllowed = isValidId && (
        (decoded.role === UserRole.PLATFORM_ADMIN)
        || (decoded.role === UserRole.SUPER_ADMIN && !decoded.company)
        || allowedCompanies.includes(requestedCompanyId)
      );

      if (!isAllowed) {
        // Stale / invalid switcher state — log and fall back, don't fail.
        // eslint-disable-next-line no-console
        console.warn(
          `[auth] Ignoring X-Active-Company=${requestedCompanyId} for user ${decoded.id}: `
          + `not in allowedCompanies. Falling back to primary company ${decoded.company}.`,
        );
      } else {
        const targetCompany = await Company.findById(requestedCompanyId).select('isActive').lean();
        if (!targetCompany || !targetCompany.isActive) {
          // Target company gone or disabled — same fallback strategy.
          // eslint-disable-next-line no-console
          console.warn(
            `[auth] X-Active-Company=${requestedCompanyId} not available; falling back to primary.`,
          );
        } else {
          activeCompany = requestedCompanyId;
        }
      }
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      userType,
      company: decoded.company || undefined,
      activeCompany,
      allowedCompanies,
      allowedModules: (user.allowedModules ?? []) as string[],
      allowedSites: (user.allowedBranches ?? []).map((id: any) => id.toString()),
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
 * Maps an NwayERP `userType` to the legacy `role` values it should
 * "inherit" for authorization purposes. The data-level scope (which records
 * the user can actually see) is enforced separately by buildResourceScope
 * (see shared/scope.ts) — this mapping only governs whether a request is
 * allowed past the role gate at all.
 *
 *   super_admin → bypass (handled by caller; always allowed)
 *   admin       → admin            (full access on assigned modules)
 *   ho_user     → admin, hr_manager (read across all sites in scope)
 *   site_admin  → admin            (all forms, site-scoped data)
 *   user        → employee         (limited self-service)
 *
 * Must stay in lockstep with the same-named function on the frontend
 * (erp-fe/src/routes/guards.tsx) so the two never disagree on visibility.
 */
function effectiveRolesFor(role?: string, userType?: string): Set<string> {
  const set = new Set<string>();
  if (role) set.add(role);
  if (userType) set.add(userType);
  switch (userType) {
    case UserType.ADMIN:
    case UserType.SITE_ADMIN:
      set.add(UserRole.ADMIN);
      break;
    case UserType.HO_USER:
      set.add(UserRole.ADMIN);
      set.add(UserRole.HR_MANAGER);
      break;
    case UserType.USER:
      set.add(UserRole.EMPLOYEE);
      break;
    default: break;
  }
  return set;
}

/**
 * Authorize access based on user roles or NwayERP user types.
 *
 * A request passes if any of the user's effective roles (legacy `role` +
 * userType-derived equivalents) is in the allowlist. userType=super_admin
 * is the always-allow tier — it bypasses any role check.
 *
 * Must be used after `authenticate`.
 */
export function authorize(...allowed: (UserRole | UserType)[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required before authorization.', 401));
      return;
    }

    // platform_admin role, super_admin role, and super_admin userType = always allow.
    if (
      req.user.role === UserRole.PLATFORM_ADMIN
      || req.user.role === UserRole.SUPER_ADMIN
      || req.user.userType === UserType.SUPER_ADMIN
    ) {
      next();
      return;
    }

    const allowedSet = new Set<string>(allowed as string[]);
    const effective = effectiveRolesFor(req.user.role, req.user.userType);
    let permitted = false;
    for (const r of effective) {
      if (allowedSet.has(r)) { permitted = true; break; }
    }

    if (!permitted) {
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

/**
 * Require the authenticated user to have access to a specific ErpModule.
 * super_admin and admin-role users bypass this check; otherwise the module
 * must appear in `allowedModules`. Empty `allowedModules` is treated as
 * "all modules" for backward compatibility with users created before the
 * userType migration.
 */
export function requireModule(moduleName: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401));
      return;
    }
    if (req.user.role === UserRole.SUPER_ADMIN || req.user.userType === UserType.SUPER_ADMIN) {
      next();
      return;
    }
    const allowedModules = req.user.allowedModules ?? [];
    if (allowedModules.length === 0 || allowedModules.includes(moduleName)) {
      next();
      return;
    }
    next(new AppError(`You do not have access to the ${moduleName} module.`, 403));
  };
}
