import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateEmployeeId } from '../../shared/helpers.js';
import { UserRole, UserType, ErpModule, type IAuthUser } from '../../shared/types.js';
import User, { type IUser } from './auth.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import { CompanyService } from '../companies/company.service.js';
import Branch from '../branches/branch.model.js';
import type { RegisterInput, UpdateProfileInput } from './auth.validator.js';

/**
 * For NwayERP-style super_admin user creation: a super_admin inherits the
 * creator's entire grantable scope — every company in the creator's group,
 * every enabled module, no site restriction. The frontend hides scope
 * pickers when userType=super_admin is selected; this resolver fills them
 * in server-side so the persisted record reflects what the role actually
 * implies, and so the resolution can't be bypassed by a hand-crafted POST.
 *
 * For other user types this is a no-op — the form values pass through.
 */
async function expandScopeByUserType(
  data: Record<string, any>,
  creator: IAuthUser | undefined,
): Promise<Record<string, any>> {
  // ── super_admin: inherit the creator's entire grantable scope ───────────
  if (data.userType === UserType.SUPER_ADMIN) {
    const callerScopeId = creator?.activeCompany ?? creator?.company;
    const group = await CompanyService.getGroupCompanies(callerScopeId);

    data.allowedCompanies = group.map((c: any) => c._id?.toString() ?? String(c._id));
    // Grant every ErpModule — current + roadmap — so the user's scope
    // expands automatically when new modules come online.
    data.allowedModules = Object.values(ErpModule);
    // super_admin is not site-scoped; clear any stale site assignments.
    data.allowedBranches = [];
    return data;
  }

  // ── site_admin / user: derive allowedCompanies from chosen branches ─────
  // The form collects sites only — we look up each branch's parent company
  // and union them into allowedCompanies. This keeps tenant scoping correct
  // when an admin assigns sites that span multiple sibling companies.
  if (data.userType === UserType.SITE_ADMIN || data.userType === UserType.USER) {
    const branchIds: string[] = Array.isArray(data.allowedBranches) ? data.allowedBranches : [];
    if (branchIds.length > 0) {
      const branches = await Branch.find({ _id: { $in: branchIds } })
        .select('company')
        .lean();
      const companyIds = new Set<string>();
      for (const b of branches) {
        if (b.company) companyIds.add(b.company.toString());
      }
      data.allowedCompanies = Array.from(companyIds);
    } else {
      // No sites picked yet — leave allowedCompanies empty so the validator
      // surfaces the missing-site error rather than implicit-everywhere.
      data.allowedCompanies = [];
    }
    return data;
  }

  // admin / ho_user / unknown: pass through; the form already collected
  // allowedCompanies and allowedModules explicitly.
  return data;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult {
  user: IUser;
  tokens: AuthTokens;
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

const SITE_POPULATE_SELECT = 'name code siteType division address01 address02 address03 city pincode stateName latitude longitude';

export class AuthService {
  /**
   * Register a new user, generate tokens, and persist the refresh token.
   *
   * `creator` is the authenticated user issuing the request; it's used to
   * resolve userType-driven scope (e.g. a super_admin inherits the creator's
   * full company group). Pass undefined for unauthenticated self-registration.
   */
  static async register(data: RegisterInput, creator?: IAuthUser): Promise<LoginResult> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const employeeId = (data as any).employeeId || generateEmployeeId();

    // Resolve userType-driven scope (super_admin → inherit creator's group).
    const expanded = await expandScopeByUserType({ ...data }, creator);

    const user = await User.create({
      ...expanded,
      employeeId,
    });

    // Auto-create EmployeeProfile for non-super_admin users only when the
    // caller did NOT already link an existing employee via `employee` FK.
    // With NwayERP-style user creation, internal users pick an existing
    // employee from a search — creating a duplicate profile would be wrong.
    const hasLinkedEmployee = !!(data as any).employee;
    if (!hasLinkedEmployee && user.role !== UserRole.SUPER_ADMIN && user.company) {
      try {
        const profile = await EmployeeProfile.create({
          userId: user._id,
          company: user.company,
          employeeId: user.employeeId,
        });
        // Back-link the created profile so the User<->Employee relationship is
        // walkable from both sides.
        user.employee = profile._id as any;
        await user.save();
      } catch (err) {
        await User.findByIdAndDelete(user._id);
        throw new AppError('Failed to create employee profile. Please try again.', 500);
      }
    }

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Authenticate a user by email/password, issue new tokens.
   */
  static async login(identifier: string, password: string): Promise<LoginResult> {
    const normalizedIdentifier = identifier.trim();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier.toLowerCase() },
        { employeeId: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    })
      .select('+password')
      .populate('company', 'name code logo')
      .populate('allowedBranches', SITE_POPULATE_SELECT);
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError(
        'Your account has been deactivated. Please contact an administrator.',
        403,
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    const accessToken = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Validate a refresh token and issue a new access/refresh pair.
   */
  static async refreshToken(token: string): Promise<AuthTokens> {
    if (!token) {
      throw new AppError('Refresh token is required.', 400);
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.refreshToken !== token) {
      // Potential token reuse: invalidate all refresh tokens for safety
      user.refreshToken = undefined;
      await user.save();
      throw new AppError('Invalid refresh token. Please log in again.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated.', 403);
    }

    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Change a user's password after verifying the current one.
   */
  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<IUser> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 401);
    }

    user.password = newPassword;
    user.passwordChangeRequired = false;
    // Invalidate existing refresh token to force re-login on other devices
    user.refreshToken = undefined;
    await user.save();
    await user.populate('company', 'name code logo');
    await user.populate('allowedBranches', SITE_POPULATE_SELECT);
    return user;
  }

  /**
   * List users, scoped by company for non-super_admin.
   */
  static async getUserById(userId: string, companyId?: string): Promise<IUser> {
    const filter: Record<string, unknown> = { _id: userId };
    if (companyId) filter.company = companyId;

    const user = await User.findOne(filter)
      .populate('company', 'name code')
      .populate('department', 'name')
      .populate('designation', 'title')
      .populate('allowedDepartments', 'name')
      .populate('allowedBranches', SITE_POPULATE_SELECT);

    if (!user) throw new AppError('User not found.', 404);
    return user;
  }

  static async getUsers(
    companyId?: string,
    callerRole?: string,
    extra: { userType?: string; isActive?: boolean; userName?: string } = {},
  ): Promise<IUser[]> {
    const filter: Record<string, unknown> = {};
    if (companyId) filter.company = companyId;

    // HR Manager can only see users at their level or below
    if (callerRole === UserRole.HR_MANAGER) {
      filter.role = { $in: [UserRole.HR_MANAGER, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.VIEWER] };
    }

    if (extra.userType) filter.userType = extra.userType;
    if (typeof extra.isActive === 'boolean') filter.isActive = extra.isActive;
    if (extra.userName) {
      filter.$or = [
        { username: { $regex: extra.userName, $options: 'i' } },
        { firstName: { $regex: extra.userName, $options: 'i' } },
        { lastName: { $regex: extra.userName, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .populate('company', 'name code')
      .populate('department', 'name')
      .populate('designation', 'title')
      .populate('allowedBranches', SITE_POPULATE_SELECT)
      .sort({ createdAt: -1 });

    return users;
  }

  /**
   * Toggle a user's active status (enable/disable).
   */
  static async toggleUserStatus(userId: string, companyId?: string): Promise<IUser> {
    const filter: Record<string, unknown> = { _id: userId };
    if (companyId) filter.company = companyId;

    const user = await User.findOne(filter);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.isActive = !user.isActive;
    // Invalidate refresh token when disabling
    if (!user.isActive) {
      user.refreshToken = undefined;
    }
    await user.save();

    return user;
  }

  /**
   * Toggle onboarding requirement for a user (admin action).
   */
  static async toggleOnboarding(userId: string, companyId?: string): Promise<IUser> {
    const filter: Record<string, unknown> = { _id: userId };
    if (companyId) filter.company = companyId;

    const user = await User.findOne(filter);
    if (!user) throw new AppError('User not found.', 404);

    user.onboardingRequired = !user.onboardingRequired;
    if (!user.onboardingRequired) {
      user.onboardingCompleted = false;
    }
    await user.save();
    await user.populate('allowedBranches', SITE_POPULATE_SELECT);
    return user;
  }

  /**
   * Mark own onboarding as complete (self action).
   */
  static async completeOnboarding(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found.', 404);

    if (!user.onboardingRequired) {
      throw new AppError('Onboarding is not required for this account.', 400);
    }

    user.onboardingCompleted = true;
    await user.save();
    return user;
  }

  /**
   * Admin update of any user (within scope). Allows setting password directly
   * for admin-driven password reset.
   */
  static async adminUpdateUser(
    userId: string,
    data: Record<string, any>,
    companyId?: string,
    creator?: IAuthUser,
  ): Promise<IUser> {
    const filter: Record<string, unknown> = { _id: userId };
    if (companyId) filter.company = companyId;

    const user = await User.findOne(filter).select('+password');
    if (!user) throw new AppError('User not found.', 404);

    // Always re-run the userType resolver on update so that:
    //   • super_admin gets the creator's full group expanded into
    //     allowedCompanies / allowedModules
    //   • site_admin / user gets allowedCompanies derived from the
    //     branches assigned in this payload
    //   • admin / ho_user pass through unchanged
    const effectiveType = data.userType ?? user.userType;
    if (effectiveType) {
      data = await expandScopeByUserType({ ...data, userType: effectiveType }, creator);
    }

    const allowed = [
      'firstName', 'lastName', 'email', 'phone', 'username',
      'userCategory', 'userType', 'isActive', 'remark',
      'allowedDepartments', 'allowedBranches', 'allowedModules',
      'allowedCompanies', 'employee',
      'department', 'designation', 'role', 'isErpDevCoUser',
      'passwordChangeRequired',
    ];
    for (const k of allowed) {
      if (data[k] !== undefined) (user as any)[k] = data[k];
    }
    if (data.password) {
      user.password = data.password; // pre-save hook re-hashes
      user.passwordChangeRequired = true;
      user.refreshToken = undefined;
    }
    await user.save();
    return user;
  }

  /**
   * Admin delete user (within scope).
   */
  static async adminDeleteUser(userId: string, companyId?: string): Promise<void> {
    const filter: Record<string, unknown> = { _id: userId };
    if (companyId) filter.company = companyId;

    const result = await User.findOneAndDelete(filter);
    if (!result) throw new AppError('User not found.', 404);
  }

  /**
   * Get user profile by ID (with populated department/designation).
   */
  static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId)
      .populate('company', 'name code logo')
      .populate('department', 'name')
      .populate('designation', 'title')
      .populate('allowedBranches', SITE_POPULATE_SELECT);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }

  /**
   * Update profile fields (non-sensitive).
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileInput,
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true },
    )
      .populate('department', 'name')
      .populate('designation', 'title');

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }
}
