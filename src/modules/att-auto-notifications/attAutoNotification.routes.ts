import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { AttAutoNotificationController } from './attAutoNotification.controller.js';
import { createAttAutoNotificationSchema } from './attAutoNotification.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', AttAutoNotificationController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createAttAutoNotificationSchema), AttAutoNotificationController.create);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), AttAutoNotificationController.delete);
export default router;
