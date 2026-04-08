import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { DashboardController } from './dashboard.controller.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/stats', DashboardController.getStats);
router.get('/attendance-overview', DashboardController.getAttendanceOverview);
router.get('/leave-overview', DashboardController.getLeaveOverview);
router.get('/department-distribution', DashboardController.getDepartmentDistribution);
router.get('/recent-activities', DashboardController.getRecentActivities);
router.get('/birthdays', DashboardController.getBirthdays);
router.get('/anniversaries', DashboardController.getAnniversaries);

export default router;
