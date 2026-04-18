import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { TagController } from './tag.controller.js';
import { createTagSchema, updateTagSchema } from './tag.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', TagController.getAll);
router.get('/:id', TagController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createTagSchema), TagController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateTagSchema), TagController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TagController.delete);
export default router;
