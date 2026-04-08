import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { LeaveController } from './leave.controller.js';
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  applyLeaveSchema,
  approveRejectSchema,
} from './leave.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Leave Type Routes ───────────────────────────────────────────────────────

router.get('/types', LeaveController.getAllTypes);

router.get('/types/:id', LeaveController.getTypeById);

router.post(
  '/types',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createLeaveTypeSchema),
  LeaveController.createType,
);

router.put(
  '/types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateLeaveTypeSchema),
  LeaveController.updateType,
);

router.delete(
  '/types/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  LeaveController.deleteType,
);

// ─── Leave Request Routes ────────────────────────────────────────────────────

router.post(
  '/apply',
  validate(applyLeaveSchema),
  LeaveController.apply,
);

router.get('/my', LeaveController.getMyLeaves);

router.get(
  '/pending-approvals',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  LeaveController.getPendingApprovals,
);

router.get('/balance/:employeeId', LeaveController.getBalance);

router.put(
  '/:id/approve',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  validate(approveRejectSchema),
  LeaveController.approve,
);

router.put(
  '/:id/reject',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER),
  validate(approveRejectSchema),
  LeaveController.reject,
);

router.put('/:id/cancel', LeaveController.cancel);

// Standard list and detail (HR view)
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  LeaveController.getAll,
);

router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  LeaveController.getById,
);

export default router;
