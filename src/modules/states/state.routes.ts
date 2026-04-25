import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { StateController } from './state.controller.js';
import { createStateSchema, updateStateSchema } from './state.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', StateController.getAll);
router.get('/:id', StateController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createStateSchema),
  StateController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateStateSchema),
  StateController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  StateController.delete,
);

export default router;
