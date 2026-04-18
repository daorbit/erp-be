import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { ImportantFormController } from './importantForm.controller.js';
import { createImportantFormSchema, updateImportantFormSchema } from './importantForm.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', ImportantFormController.getAll);
router.get('/:id', ImportantFormController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createImportantFormSchema), ImportantFormController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateImportantFormSchema), ImportantFormController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ImportantFormController.delete);
export default router;
