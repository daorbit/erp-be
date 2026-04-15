import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { LeaveFinyearController } from './leaveFinyear.controller.js';
import { createLeaveFinyearSchema, updateLeaveFinyearSchema } from './leaveFinyear.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', LeaveFinyearController.getAll);
router.get('/:id', LeaveFinyearController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createLeaveFinyearSchema), LeaveFinyearController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateLeaveFinyearSchema), LeaveFinyearController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), LeaveFinyearController.delete);
export default router;
