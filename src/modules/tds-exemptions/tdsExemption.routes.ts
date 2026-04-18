import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { TdsExemptionController } from './tdsExemption.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', TdsExemptionController.getAll);
router.get('/:id', TdsExemptionController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TdsExemptionController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TdsExemptionController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), TdsExemptionController.delete);
export default router;
