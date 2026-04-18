import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { OtherIncomeController } from './otherIncome.controller.js';
import { createOtherIncomeSchema, updateOtherIncomeSchema } from './otherIncome.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', OtherIncomeController.getAll);
router.get('/:id', OtherIncomeController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createOtherIncomeSchema), OtherIncomeController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateOtherIncomeSchema), OtherIncomeController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), OtherIncomeController.delete);
export default router;
