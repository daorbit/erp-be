import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { AttendanceController } from './attendance.controller.js';
import {
  checkInSchema,
  checkOutSchema,
  markAttendanceSchema,
  bulkMarkAttendanceSchema,
} from './attendance.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCompany);

// Employee self-service routes (before parameterized routes)
router.post(
  '/check-in',
  validate(checkInSchema),
  AttendanceController.checkIn,
);

router.post(
  '/check-out',
  validate(checkOutSchema),
  AttendanceController.checkOut,
);

router.get('/my', AttendanceController.getMyAttendance);

router.get('/summary/:employeeId', AttendanceController.getSummary);

// HR/Admin routes
router.get(
  '/daily-report',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  AttendanceController.getDailyReport,
);

router.post(
  '/mark',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(markAttendanceSchema),
  AttendanceController.markAttendance,
);

router.post(
  '/bulk-mark',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER),
  validate(bulkMarkAttendanceSchema),
  AttendanceController.bulkMarkAttendance,
);

// Standard CRUD
router.get('/', AttendanceController.getAll);

router.get('/:id', AttendanceController.getById);

export default router;
