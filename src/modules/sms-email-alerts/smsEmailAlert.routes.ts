import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { SmsEmailAlertController } from './smsEmailAlert.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', SmsEmailAlertController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), SmsEmailAlertController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), SmsEmailAlertController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), SmsEmailAlertController.delete);
export default router;
