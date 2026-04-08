import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as trainingController from './training.controller.js';
import {
  createTrainingSchema,
  updateTrainingSchema,
  enrollEmployeeSchema,
  completeTrainingSchema,
  dropEmployeeSchema,
} from './training.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);

// ─── Employee Self Routes (must come before /:id) ───────────────────────────

router.get('/my', trainingController.getMyTrainings);
router.get('/upcoming', trainingController.getUpcoming);

// ─── CRUD Routes ────────────────────────────────────────────────────────────

router.get('/', trainingController.getAll);
router.get('/:id', trainingController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createTrainingSchema),
  trainingController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateTrainingSchema),
  trainingController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  trainingController.remove,
);

// ─── Enrollment Routes ──────────────────────────────────────────────────────

router.post(
  '/:id/enroll',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(enrollEmployeeSchema),
  trainingController.enrollEmployee,
);

router.put(
  '/:id/complete',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(completeTrainingSchema),
  trainingController.completeTraining,
);

router.put(
  '/:id/drop',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(dropEmployeeSchema),
  trainingController.dropEmployee,
);

export default router;
