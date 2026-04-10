import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { AnnouncementController } from './announcement.controller.js';
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcement.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCompany);

// Special endpoints (before parameterized routes)
router.get('/active', AnnouncementController.getActive);

// Standard CRUD
router.get('/', AnnouncementController.getAll);

router.get('/:id', AnnouncementController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createAnnouncementSchema),
  AnnouncementController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateAnnouncementSchema),
  AnnouncementController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  AnnouncementController.delete,
);

// Mark as read
router.put('/:id/read', AnnouncementController.markRead);

export default router;
