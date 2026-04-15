import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { ResignationController } from './resignation.controller.js';
import { createResignationSchema, updateResignationSchema } from './resignation.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', ResignationController.getAll);
router.get('/:id', ResignationController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), validate(createResignationSchema), ResignationController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), validate(updateResignationSchema), ResignationController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ResignationController.delete);
export default router;
