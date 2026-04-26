import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateEmployeeId } from '../../shared/helpers.js';
import { UserRole } from '../../shared/types.js';
import User, { type IUser } from './auth.model.js';
import EmployeeProfile from '../employees/employee.model.js';
import type { RegisterInput, UpdateProfileInput } from './auth.validator.js';

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

export class AuthService {
  /**
   * Register a new user, generate tokens, and persist the refresh token.
   */
  static async register(data: RegisterInput): Promise<LoginResult> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const employeeId = generateEmployeeId();

    const user = await User.create({
      ...data,
      employeeId,
    });

    // Auto-create EmployeeProfile for non-super_admin users
    if (user.role !== UserRole.SUPER_ADMIN && user.company) {
      try {
        await EmployeeProfile.create({
          userId: user._id,
          company: user.company,
          employeeId: user.employeeId,
        });
      } catch (err) {
        // Rollback: delete the user if profile creation fails
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
  static async login(email: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ email }).select('+password').populate('company', 'name code logo');
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
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', 401);
    }

    user.password = newPassword;
    // Invalidate existing refresh token to force re-login on other devices
    user.refreshToken = undefined;
    await user.save();
  }

  /**
   * List users, scoped by company for non-super_admin.
   */
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
  ): Promise<IUser> {
    const filter: Record<string, unknown> = { _id: userId };
    if (companyId) filter.company = companyId;

    const user = await User.findOne(filter).select('+password');
    if (!user) throw new AppError('User not found.', 404);

    const allowed = [
      'firstName', 'lastName', 'email', 'phone', 'username',
      'userCategory', 'userType', 'isActive', 'remark',
      'allowedDepartments', 'allowedBranches', 'allowedModules',
      'department', 'designation', 'role',
    ];
    for (const k of allowed) {
      if (data[k] !== undefined) (user as any)[k] = data[k];
    }
    if (data.password) {
      user.password = data.password; // pre-save hook re-hashes
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
      .populate('designation', 'title');

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
