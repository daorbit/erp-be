import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { EmployeeController } from './employee.controller.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCompany);

// Routes with specific path patterns must come before parameterized routes
router.get(
  '/department/:departmentId',
  EmployeeController.getByDepartment,
);

router.get(
  '/reportees/:managerId',
  EmployeeController.getReportees,
);

// Bulk update — must be before /:id so it isn't shadowed.
router.post(
  '/bulk-update',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  EmployeeController.bulkUpdate,
);

router.get('/:id/full-and-final', EmployeeController.fullAndFinal);

// Standard CRUD
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  EmployeeController.getAll,
);

router.get('/:id/attendance', EmployeeController.getEmployeeAttendance);
router.get('/:id/payslips', EmployeeController.getEmployeePayslips);

router.get(
  '/:id',
  EmployeeController.getById,
);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(createEmployeeSchema),
  EmployeeController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(updateEmployeeSchema),
  EmployeeController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  EmployeeController.delete,
);

export default router;
