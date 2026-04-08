import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../middleware/errorHandler.js';
import { buildResponse } from '../../shared/helpers.js';
import { AuthService } from './auth.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);

  res.status(201).json(
    buildResponse(true, {
      user: result.user,
      tokens: result.tokens,
    }, 'Registration successful'),
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthService.login(email, password);

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
