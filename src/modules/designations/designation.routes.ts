import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { DesignationController } from './designation.controller.js';
import { createDesignationSchema, updateDesignationSchema, mergeDesignationsSchema } from './designation.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCompany);

// Must be before /:id to avoid being shadowed
router.get('/employee-count', DesignationController.employeeCount);

router.post(
  '/merge',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(mergeDesignationsSchema),
  DesignationController.merge,
);

router.get('/', DesignationController.getAll);

router.get('/:id', DesignationController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createDesignationSchema),
  DesignationController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateDesignationSchema),
  DesignationController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DesignationController.delete,
);

export default router;
