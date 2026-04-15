import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { AttUploadSiteController } from './attUploadSite.controller.js';
import { createAttUploadSiteSchema } from './attUploadSite.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', AttUploadSiteController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createAttUploadSiteSchema), AttUploadSiteController.create);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), AttUploadSiteController.delete);
export default router;
