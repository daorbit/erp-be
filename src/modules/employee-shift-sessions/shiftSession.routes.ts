import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { upload } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { ShiftSessionController } from './shiftSession.controller.js';
import {
  endShiftSessionSchema,
  startShiftSessionSchema,
  trackGpsSchema,
} from './shiftSession.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

// ─── Employee self-service endpoints (any authenticated user with employee profile) ──
router.get('/active', ShiftSessionController.getActive);
router.get('/my', ShiftSessionController.getMy);

router.post(
  '/start',
  authorize(UserRole.EMPLOYEE),
  upload.single('selfie'),
  validate(startShiftSessionSchema),
  ShiftSessionController.start,
);

router.post(
  '/:id/track',
  authorize(UserRole.EMPLOYEE),
  validate(trackGpsSchema),
  ShiftSessionController.track,
);

router.post(
  '/:id/end',
  authorize(UserRole.EMPLOYEE),
  validate(endShiftSessionSchema),
  ShiftSessionController.end,
);

// ─── Admin / HR endpoints ──────────────────────────────────────────────────
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  ShiftSessionController.getAll,
);

// Detail — accessible to owner OR admin/HR (controller enforces).
router.get('/:id', ShiftSessionController.getOne);

export default router;
