import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { LocationController } from './location.controller.js';
import { createLocationSchema, updateLocationSchema } from './location.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', LocationController.getAll);
router.get('/:id', LocationController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createLocationSchema),
  LocationController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateLocationSchema),
  LocationController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  LocationController.delete,
);

export default router;
