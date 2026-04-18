import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { EmployeeGroupController } from './employeeGroup.controller.js';
import { createEmployeeGroupSchema, updateEmployeeGroupSchema } from './employeeGroup.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', EmployeeGroupController.getAll);
router.get('/:id', EmployeeGroupController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createEmployeeGroupSchema),
  EmployeeGroupController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateEmployeeGroupSchema),
  EmployeeGroupController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  EmployeeGroupController.delete,
);

export default router;
