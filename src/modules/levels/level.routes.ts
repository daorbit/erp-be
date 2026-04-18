import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { LevelController } from './level.controller.js';
import { createLevelSchema, updateLevelSchema } from './level.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', LevelController.getAll);
router.get('/:id', LevelController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createLevelSchema), LevelController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateLevelSchema), LevelController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), LevelController.delete);
export default router;
