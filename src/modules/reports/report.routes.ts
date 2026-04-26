import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import * as reportController from './report.controller.js';

const router = Router();

// All report routes require authentication and HR_MANAGER+ access
router.use(authenticate as never);
router.use(requireCompany);
router.use(
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
);

router.get('/employees', reportController.getEmployeeReport);
router.get('/user-work', reportController.getUserWorkReport);
router.get('/site-wise-users', reportController.getSiteWiseUsers);
router.get('/attendance', reportController.getAttendanceReport);
router.get('/payroll', reportController.getPayrollReport);
router.get('/recruitment', reportController.getRecruitmentReport);
router.get('/headcount', reportController.getHeadcountReport);
router.get('/turnover', reportController.getTurnoverReport);

export default router;
