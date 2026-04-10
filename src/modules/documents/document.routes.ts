import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as documentController from './document.controller.js';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
} from './document.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);
router.use(requireCompany);

// ─── Specific Routes (before /:id) ─────────────────────────────────────────

router.get('/public', documentController.getPublicDocuments);
router.get('/employee/:employeeId', documentController.getByEmployee);
router.get('/category/:category', documentController.getByCategory);

// ─── CRUD Routes ────────────────────────────────────────────────────────────

router.get('/', documentController.getAll);
router.get('/:id', documentController.getById);

router.post(
  '/upload',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(uploadDocumentSchema),
  documentController.upload,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateDocumentSchema),
  documentController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  documentController.remove,
);

export default router;
