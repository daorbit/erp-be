import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { ParentDepartmentController } from './parentDepartment.controller.js';
import { createParentDepartmentSchema, updateParentDepartmentSchema } from './parentDepartment.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', ParentDepartmentController.getAll);
router.get('/:id', ParentDepartmentController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createParentDepartmentSchema),
  ParentDepartmentController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateParentDepartmentSchema),
  ParentDepartmentController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ParentDepartmentController.delete,
);

export default router;
