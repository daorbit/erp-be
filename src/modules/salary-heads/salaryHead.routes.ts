import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { SalaryHeadController } from './salaryHead.controller.js';
import { createSalaryHeadSchema, updateSalaryHeadSchema } from './salaryHead.validator.js';

const router = Router();
router.use(authenticate);
router.use(requireCompany);

router.get('/', SalaryHeadController.getAll);
router.get('/:id', SalaryHeadController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createSalaryHeadSchema),
  SalaryHeadController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateSalaryHeadSchema),
  SalaryHeadController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SalaryHeadController.delete,
);

export default router;
