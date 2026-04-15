import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { SimController } from './sim.controller.js';
import { createSimSchema, updateSimSchema } from './sim.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', SimController.getAll);
router.get('/:id', SimController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createSimSchema), SimController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateSimSchema), SimController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), SimController.delete);
export default router;
