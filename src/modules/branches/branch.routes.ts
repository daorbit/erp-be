import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { BranchController } from './branch.controller.js';
import { createBranchSchema, updateBranchSchema } from './branch.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', BranchController.getAll);
router.get('/:id', BranchController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createBranchSchema),
  BranchController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateBranchSchema),
  BranchController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BranchController.delete,
);

export default router;
