import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { BankController } from './bank.controller.js';
import { createBankSchema, updateBankSchema } from './bank.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', BankController.getAll);
router.get('/:id', BankController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createBankSchema), BankController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateBankSchema), BankController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), BankController.delete);
export default router;
