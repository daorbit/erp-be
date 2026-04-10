import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as recruitmentController from './recruitment.controller.js';
import {
  createJobPostingSchema,
  updateJobPostingSchema,
  updateJobStatusSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
  scheduleInterviewSchema,
} from './recruitment.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);
router.use(requireCompany);

// ─── Job Posting Routes ─────────────────────────────────────────────────────

router.get('/jobs', recruitmentController.getAllJobs);
router.get('/jobs/:id', recruitmentController.getJobById);

router.post(
  '/jobs',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createJobPostingSchema),
  recruitmentController.createJob,
);

router.put(
  '/jobs/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateJobPostingSchema),
  recruitmentController.updateJob,
);

router.delete(
  '/jobs/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  recruitmentController.deleteJob,
);

router.put(
  '/jobs/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateJobStatusSchema),
  recruitmentController.updateJobStatus,
);

router.get('/jobs/:jobId/applications', recruitmentController.getApplicationsByJob);
router.get('/jobs/:jobId/stats', recruitmentController.getJobStats);

// ─── Application Routes ────────────────────────────────────────────────────

router.get('/applications', recruitmentController.getAllApplications);
router.get('/applications/:id', recruitmentController.getApplicationById);

router.post(
  '/applications',
  validate(createApplicationSchema),
  recruitmentController.createApplication,
);

router.put(
  '/applications/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateApplicationStatusSchema),
  recruitmentController.updateApplicationStatus,
);

router.put(
  '/applications/:id/schedule-interview',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(scheduleInterviewSchema),
  recruitmentController.scheduleInterview,
);

export default router;
