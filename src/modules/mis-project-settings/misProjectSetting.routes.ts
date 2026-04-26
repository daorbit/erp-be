import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { MisProjectSettingController } from './misProjectSetting.controller.js';

const router = Router();
router.use(authenticate);
router.use(requireCompany);

router.get('/', MisProjectSettingController.getAll);
router.get('/by-user/:userId', MisProjectSettingController.getByUser);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), MisProjectSettingController.upsert);

export default router;
