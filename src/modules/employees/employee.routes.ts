import { Router } from 'express';
import { authenticate, authorize, requireModule } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { ErpModule, UserRole } from '../../shared/types.js';
import { EmployeeController } from './employee.controller.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.validator.js';

const router = Router();

// All routes require authentication, an associated company, and access to
// the HUMAN_RESOURCE module. The module gate is permissive for legacy
// users whose `allowedModules` is empty — those records pre-date the
// userType migration and aren't blocked retroactively.
router.use(authenticate);
router.use(requireCompany);
router.use(requireModule(ErpModule.HUMAN_RESOURCE));

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

router.post(
  '/:id/quick-create-user',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  EmployeeController.quickCreateUser,
);

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
