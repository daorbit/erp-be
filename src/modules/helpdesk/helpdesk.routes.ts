import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import * as helpdeskController from './helpdesk.controller.js';
import {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  addCommentSchema,
  updateTicketStatusSchema,
  closeTicketSchema,
} from './helpdesk.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate as never);
router.use(requireCompany);

// ─── Specific Routes (before /:id) ─────────────────────────────────────────

router.get('/my', helpdeskController.getMyTickets);
router.get('/assigned', helpdeskController.getAssignedTickets);

router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  helpdeskController.getStats,
);

// ─── CRUD Routes ────────────────────────────────────────────────────────────

router.get('/', helpdeskController.getAll);
router.get('/:id', helpdeskController.getById);

router.post(
  '/',
  validate(createTicketSchema),
  helpdeskController.create,
);

router.put(
  '/:id',
  validate(updateTicketSchema),
  helpdeskController.update,
);

// ─── Workflow Routes ────────────────────────────────────────────────────────

router.put(
  '/:id/assign',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(assignTicketSchema),
  helpdeskController.assign,
);

router.post(
  '/:id/comment',
  validate(addCommentSchema),
  helpdeskController.addComment,
);

router.put(
  '/:id/status',
  validate(updateTicketStatusSchema),
  helpdeskController.updateStatus,
);

router.put(
  '/:id/close',
  validate(closeTicketSchema),
  helpdeskController.close,
);

export default router;
