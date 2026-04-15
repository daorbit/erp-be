import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { UserRightController } from './userRight.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', UserRightController.get);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserRightController.save);
router.post('/copy', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserRightController.copy);
export default router;
