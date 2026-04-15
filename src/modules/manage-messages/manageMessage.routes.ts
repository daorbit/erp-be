import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { ManageMessageController } from './manageMessage.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', ManageMessageController.getAll);
router.get('/:id', ManageMessageController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ManageMessageController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ManageMessageController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ManageMessageController.delete);
export default router;
