import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { InvitationController } from './invitation.controller.js';
import { createInvitationSchema, acceptInvitationSchema } from './invitation.validator.js';

const router = Router();

// Public routes (no auth needed)
router.get('/:token', InvitationController.getByToken);
router.post('/accept', validate(acceptInvitationSchema), InvitationController.accept);

// Protected routes (admin only)
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createInvitationSchema),
  InvitationController.create,
);

router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  InvitationController.getAll,
);

export default router;
