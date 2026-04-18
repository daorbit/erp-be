import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { SalaryStructureController } from './salaryStructure.controller.js';
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  assignSalaryHeadSchema,
  updateAssignedHeadSchema,
} from './salaryStructure.validator.js';

const router = Router();
router.use(authenticate);
router.use(requireCompany);

// ─── Assigned heads (specific sub-routes before :id) ────────────────────────
router.get('/:id/heads', SalaryStructureController.getAssignedHeads);

router.post(
  '/heads',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(assignSalaryHeadSchema),
  SalaryStructureController.assignHead,
);

router.put(
  '/heads/:assignmentId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateAssignedHeadSchema),
  SalaryStructureController.updateAssignedHead,
);

router.delete(
  '/heads/:assignmentId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SalaryStructureController.removeAssignedHead,
);

// Bulk apply operations from Master → Employee flows.
router.post('/bulk-assign-employees', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), SalaryStructureController.bulkAssignToEmployees);
router.post('/bulk-appraisal', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), SalaryStructureController.bulkAppraisal);

// ─── Structure CRUD ─────────────────────────────────────────────────────────
router.get('/', SalaryStructureController.getAll);
router.get('/:id', SalaryStructureController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createSalaryStructureSchema),
  SalaryStructureController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateSalaryStructureSchema),
  SalaryStructureController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SalaryStructureController.delete,
);

export default router;
