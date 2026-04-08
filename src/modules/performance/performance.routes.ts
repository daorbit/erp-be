import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as performanceController from './performance.controller.js';
import {
  createReviewSchema,
  updateReviewSchema,
  createGoalSchema,
  updateGoalSchema,
  updateGoalProgressSchema,
} from './performance.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);

// ─── Review Routes ──────────────────────────────────────────────────────────

router.get('/reviews/my', performanceController.getMyReviews);

router.get(
  '/reviews/pending',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  performanceController.getPendingReviews,
);

router.get('/reviews', performanceController.getAllReviews);
router.get('/reviews/:id', performanceController.getReviewById);

router.post(
  '/reviews',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createReviewSchema),
  performanceController.createReview,
);

router.put(
  '/reviews/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateReviewSchema),
  performanceController.updateReview,
);

router.delete(
  '/reviews/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  performanceController.deleteReview,
);

router.put('/reviews/:id/submit', performanceController.submitReview);

// ─── Goal Routes ────────────────────────────────────────────────────────────

router.get('/goals/my', performanceController.getMyGoals);

router.get(
  '/goals/employee/:employeeId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  performanceController.getGoalsByEmployee,
);

router.get('/goals', performanceController.getAllGoals);
router.get('/goals/:id', performanceController.getGoalById);

router.post(
  '/goals',
  validate(createGoalSchema),
  performanceController.createGoal,
);

router.put(
  '/goals/:id',
  validate(updateGoalSchema),
  performanceController.updateGoal,
);

router.delete('/goals/:id', performanceController.deleteGoal);

router.put(
  '/goals/:id/progress',
  validate(updateGoalProgressSchema),
  performanceController.updateGoalProgress,
);

export default router;
