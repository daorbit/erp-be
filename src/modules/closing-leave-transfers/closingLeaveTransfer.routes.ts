import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { ClosingLeaveTransferController } from './closingLeaveTransfer.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', ClosingLeaveTransferController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), ClosingLeaveTransferController.transfer);
export default router;
