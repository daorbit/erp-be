import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { GradeController } from './grade.controller.js';
import { createGradeSchema, updateGradeSchema } from './grade.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', GradeController.getAll);
router.get('/:id', GradeController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createGradeSchema), GradeController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateGradeSchema), GradeController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), GradeController.delete);
export default router;
