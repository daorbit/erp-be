import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { TdsGroupController } from './tdsGroup.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', TdsGroupController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TdsGroupController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TdsGroupController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TdsGroupController.delete);
export default router;
