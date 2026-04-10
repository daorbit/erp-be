import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as assetController from './asset.controller.js';
import {
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
} from './asset.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);
router.use(requireCompany);

// ─── Specific Routes (before /:id) ─────────────────────────────────────────

router.get(
  '/available',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  assetController.getAvailable,
);

router.get(
  '/maintenance-due',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  assetController.getMaintenanceDue,
);

router.get('/employee/:employeeId', assetController.getByEmployee);

// ─── CRUD Routes ────────────────────────────────────────────────────────────

router.get('/', assetController.getAll);
router.get('/:id', assetController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createAssetSchema),
  assetController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateAssetSchema),
  assetController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  assetController.remove,
);

// ─── Assignment Routes ──────────────────────────────────────────────────────

router.put(
  '/:id/assign',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(assignAssetSchema),
  assetController.assignToEmployee,
);

router.put(
  '/:id/return',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(returnAssetSchema),
  assetController.returnAsset,
);

export default router;
