import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { DocumentMasterController } from './documentMaster.controller.js';
import { createDocumentMasterSchema, updateDocumentMasterSchema } from './documentMaster.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', DocumentMasterController.getAll);
router.get('/:id', DocumentMasterController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createDocumentMasterSchema), DocumentMasterController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateDocumentMasterSchema), DocumentMasterController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), DocumentMasterController.delete);
export default router;
