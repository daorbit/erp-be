import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { QualificationController } from './qualification.controller.js';
import { createQualificationSchema, updateQualificationSchema } from './qualification.validator.js';

const router = Router();
router.use(authenticate);
router.use(requireCompany);

router.get('/', QualificationController.getAll);
router.get('/:id', QualificationController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createQualificationSchema), QualificationController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateQualificationSchema), QualificationController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), QualificationController.delete);

export default router;
