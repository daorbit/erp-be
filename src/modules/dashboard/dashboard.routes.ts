import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { DashboardController } from './dashboard.controller.js';
import { PlatformDashboardController } from './platformDashboard.controller.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// ─── Platform Admin Dashboard (super_admin only) ─────────────────────────────
router.get('/platform/stats', authorize(UserRole.SUPER_ADMIN), PlatformDashboardController.getStats);
router.get('/platform/company-overviews', authorize(UserRole.SUPER_ADMIN), PlatformDashboardController.getCompanyOverviews);
router.get('/platform/company-growth', authorize(UserRole.SUPER_ADMIN), PlatformDashboardController.getCompanyGrowth);
router.get('/platform/user-distribution', authorize(UserRole.SUPER_ADMIN), PlatformDashboardController.getUserDistribution);

// ─── Company Dashboard (company-scoped) ──────────────────────────────────────
router.use(requireCompany);

router.get('/stats', DashboardController.getStats);
router.get('/attendance-overview', DashboardController.getAttendanceOverview);
router.get('/department-distribution', DashboardController.getDepartmentDistribution);
router.get('/recent-activities', DashboardController.getRecentActivities);
router.get('/birthdays', DashboardController.getBirthdays);
router.get('/anniversaries', DashboardController.getAnniversaries);

export default router;
