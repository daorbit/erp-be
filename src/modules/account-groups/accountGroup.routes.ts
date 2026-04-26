import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { AccountGroupController } from './accountGroup.controller.js';
import { createAccountGroupSchema, updateAccountGroupSchema } from './accountGroup.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', AccountGroupController.getAll);
router.get('/:id', AccountGroupController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createAccountGroupSchema),
  AccountGroupController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateAccountGroupSchema),
  AccountGroupController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AccountGroupController.remove,
);

export default router;
