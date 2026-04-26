import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { MobileAppCountController } from './mobileAppCount.controller.js';

const router = Router();
router.use(authenticate);
router.use(requireCompany);

router.get('/', MobileAppCountController.get);
router.put('/limits', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), MobileAppCountController.updateLimits);
router.get('/activation-users', MobileAppCountController.listUsers);
router.post('/activation-users', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), MobileAppCountController.addUser);
router.put('/activation-users/:userId', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), MobileAppCountController.updateUser);

export default router;
