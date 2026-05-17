import { Router } from 'express';
import { authenticate, requirePlatformAdmin } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { DashboardController } from './dashboard.controller.js';
import { PlatformDashboardController } from './platformDashboard.controller.js';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// ─── Platform Admin Dashboard (true platform users only) ─────────────────────
// Uses requirePlatformAdmin instead of authorize() because the latter
// bypasses for any super_admin role — that would let a company-level
// super_admin read every tenant's stats. requirePlatformAdmin restricts
// to platform_admin (or legacy super_admin without a company).
router.get('/platform/stats', requirePlatformAdmin, PlatformDashboardController.getStats);
router.get('/platform/company-overviews', requirePlatformAdmin, PlatformDashboardController.getCompanyOverviews);
router.get('/platform/company-growth', requirePlatformAdmin, PlatformDashboardController.getCompanyGrowth);
router.get('/platform/user-distribution', requirePlatformAdmin, PlatformDashboardController.getUserDistribution);

// ─── Company Dashboard (company-scoped) ──────────────────────────────────────
router.use(requireCompany);

router.get('/stats', DashboardController.getStats);
router.get('/attendance-overview', DashboardController.getAttendanceOverview);
router.get('/department-distribution', DashboardController.getDepartmentDistribution);
router.get('/recent-activities', DashboardController.getRecentActivities);
router.get('/birthdays', DashboardController.getBirthdays);
router.get('/anniversaries', DashboardController.getAnniversaries);

export default router;
