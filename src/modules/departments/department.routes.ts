import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { DepartmentController } from './department.controller.js';
import { createDepartmentSchema, updateDepartmentSchema } from './department.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tree endpoint (before /:id to avoid conflict)
router.get('/tree', DepartmentController.getTree);

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
