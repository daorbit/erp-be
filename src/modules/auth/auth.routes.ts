import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as authController from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.validator.js';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);

// Admin-only: create users
router.post(
  '/register',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(registerSchema),
  authController.register,
);

// Admin-only: list users
router.get(
  '/users',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  authController.getUsers,
);

// Protected routes
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.get('/me', authenticate, authController.getMe);
router.get('/profile', authenticate, authController.getProfile);
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile,
);

export default router;
