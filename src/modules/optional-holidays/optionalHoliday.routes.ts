import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { OptionalHolidayController } from './optionalHoliday.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', OptionalHolidayController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), OptionalHolidayController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), OptionalHolidayController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), OptionalHolidayController.delete);
export default router;
