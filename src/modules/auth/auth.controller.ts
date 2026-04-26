import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import { AuthService } from './auth.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  res.status(201).json(
    buildResponse(true, {
      user: result.user,
    }, 'User created successfully'),
  );
});

export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.toggleUserStatus(req.params.id as string, req.user?.company);

  res.status(200).json(
    buildResponse(true, user, `User ${user.isActive ? 'enabled' : 'disabled'} successfully`),
  );
});

export const toggleOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.toggleOnboarding(req.params.id as string, req.user?.company);

  res.status(200).json(
    buildResponse(true, user, `Onboarding ${user.onboardingRequired ? 'enabled' : 'disabled'} for user`),
  );
});

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required.', 401);

  const user = await AuthService.completeOnboarding(req.user.id);

  res.status(200).json(
    buildResponse(true, user, 'Onboarding completed successfully'),
  );
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  // Support User List page filters: userType / isActive / userName.
  const extra: { userType?: string; isActive?: boolean; userName?: string } = {};
  if (typeof req.query.userType === 'string') extra.userType = req.query.userType;
  if (typeof req.query.isActive === 'string') extra.isActive = req.query.isActive === 'true';
  if (typeof req.query.userName === 'string') extra.userName = req.query.userName;

  const users = await AuthService.getUsers(req.user?.company, req.user?.role, extra);

  res.status(200).json(
    buildResponse(true, users, 'Users retrieved successfully'),
  );
});

export const adminUpdateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.adminUpdateUser(
    req.params.id as string,
    req.body || {},
    req.user?.company,
  );
  res.status(200).json(buildResponse(true, user, 'User updated successfully'));
});

export const adminDeleteUser = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.adminDeleteUser(req.params.id as string, req.user?.company);
  res.status(200).json(buildResponse(true, null, 'User deleted successfully'));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);

  // Make the authenticated user available to the audit logger middleware,
  // which fires after `res.end` and reads `req.user`. Without this, login
  // audit rows would be saved with no user reference and the Login Log
  // report's date/user filters would all match nothing.
  if (result.user) {
    (req as any).user = {
      id: (result.user as any)._id || (result.user as any).id,
      email: result.user.email,
      role: result.user.role,
      company: result.user.company,
    };
  }

  res.status(200).json(
    buildResponse(true, {
      user: result.user,
      tokens: result.tokens,
    }, 'Login successful'),
  );
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const tokens = await AuthService.refreshToken(token);

  res.status(200).json(
    buildResponse(true, { tokens }, 'Token refreshed successfully'),
  );
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const { oldPassword, newPassword } = req.body;
  await AuthService.changePassword(req.user.id, oldPassword, newPassword);

  res.status(200).json(
    buildResponse(true, null, 'Password changed successfully'),
  );
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const user = await AuthService.getProfile(req.user.id);

  res.status(200).json(
    buildResponse(true, user, 'User retrieved successfully'),
  );
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const user = await AuthService.getProfile(req.user.id);

  res.status(200).json(
    buildResponse(true, { user }, 'Profile retrieved successfully'),
  );
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const user = await AuthService.updateProfile(req.user.id, req.body);

  res.status(200).json(
    buildResponse(true, { user }, 'Profile updated successfully'),
  );
});
