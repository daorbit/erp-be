import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateEmployeeId } from '../../shared/helpers.js';
import { UserRole } from '../../shared/types.js';
import User, { type IUser } from './auth.model.js';
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
