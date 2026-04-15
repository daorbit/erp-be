import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { EmpLeaveOpeningController } from './empLeaveOpening.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', EmpLeaveOpeningController.get);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), EmpLeaveOpeningController.save);
export default router;
