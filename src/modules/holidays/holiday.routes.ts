import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { HolidayController } from './holiday.controller.js';
import { createHolidaySchema, updateHolidaySchema } from './holiday.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireCompany);

// Special endpoints (before parameterized routes)
router.get('/upcoming', HolidayController.getUpcoming);
router.get('/year/:year', HolidayController.getByYear);

// Standard CRUD
router.get('/', HolidayController.getAll);

router.get('/:id', HolidayController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createHolidaySchema),
  HolidayController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateHolidaySchema),
  HolidayController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  HolidayController.delete,
);

export default router;
