import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { DepartmentController } from './department.controller.js';
import { createDepartmentSchema, updateDepartmentSchema, mergeDepartmentsSchema } from './department.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCompany);

// Tree endpoint (before /:id to avoid conflict)
router.get('/tree', DepartmentController.getTree);

// Merge: reassign users from source → target, then soft-delete source.
router.post(
  '/merge',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(mergeDepartmentsSchema),
  DepartmentController.merge,
);

// Standard CRUD
router.get('/', DepartmentController.getAll);

router.get('/:id', DepartmentController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createDepartmentSchema),
  DepartmentController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateDepartmentSchema),
  DepartmentController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  DepartmentController.delete,
);

export default router;
