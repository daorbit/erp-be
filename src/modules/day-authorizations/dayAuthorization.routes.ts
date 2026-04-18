import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { DayAuthorizationController } from './dayAuthorization.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', DayAuthorizationController.get);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), DayAuthorizationController.save);
export default router;
