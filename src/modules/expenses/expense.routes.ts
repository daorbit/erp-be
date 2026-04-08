import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as expenseController from './expense.controller.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  approveRejectSchema,
  reimburseSchema,
} from './expense.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);

// ─── Specific Routes (before /:id) ─────────────────────────────────────────

router.get('/my', expenseController.getMyExpenses);

router.get(
  '/pending-approvals',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  expenseController.getPendingApprovals,
);

router.get(
  '/summary',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  expenseController.getSummary,
);

// ─── CRUD Routes ────────────────────────────────────────────────────────────

router.get('/', expenseController.getAll);
router.get('/:id', expenseController.getById);

router.post(
  '/',
  validate(createExpenseSchema),
  expenseController.create,
);

router.put(
  '/:id',
  validate(updateExpenseSchema),
  expenseController.update,
);

router.delete('/:id', expenseController.remove);

// ─── Workflow Routes ────────────────────────────────────────────────────────

router.post('/submit/:id', expenseController.submit);

router.put(
  '/:id/approve',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  validate(approveRejectSchema),
  expenseController.approve,
);

router.put(
  '/:id/reject',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  validate(approveRejectSchema),
  expenseController.reject,
);

router.put(
  '/:id/reimburse',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(reimburseSchema),
  expenseController.reimburse,
);

export default router;
