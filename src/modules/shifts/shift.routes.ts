import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { ShiftController } from './shift.controller.js';
import { createShiftSchema, updateShiftSchema } from './shift.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', ShiftController.getAll);
router.get('/:id', ShiftController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createShiftSchema),
  ShiftController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateShiftSchema),
  ShiftController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ShiftController.delete,
);

export default router;
