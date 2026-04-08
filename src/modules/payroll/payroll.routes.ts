import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { PayrollController } from './payroll.controller.js';
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  generatePayslipSchema,
  bulkGenerateSchema,
  markPaidSchema,
} from './payroll.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Salary Structure Routes ─────────────────────────────────────────────────

router.get(
  '/salary-structure',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  PayrollController.getAllStructures,
);

router.get(
  '/salary-structure/employee/:employeeId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  PayrollController.getByEmployee,
);

router.get(
  '/salary-structure/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  PayrollController.getStructureById,
);

router.post(
  '/salary-structure',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createSalaryStructureSchema),
  PayrollController.createStructure,
);

router.put(
  '/salary-structure/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateSalaryStructureSchema),
  PayrollController.updateStructure,
);

// ─── Payslip Routes ──────────────────────────────────────────────────────────

router.get('/my', PayrollController.getMyPayslips);

router.get(
  '/summary',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  PayrollController.getSummary,
);

router.post(
  '/generate',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(generatePayslipSchema),
  PayrollController.generate,
);

router.post(
  '/bulk-generate',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(bulkGenerateSchema),
  PayrollController.bulkGenerate,
);

router.put(
  '/:id/approve',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  PayrollController.approve,
);

router.put(
  '/:id/mark-paid',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(markPaidSchema),
  PayrollController.markPaid,
);

// Standard list and detail
router.get('/', PayrollController.getAll);

router.get('/:id', PayrollController.getById);

export default router;
