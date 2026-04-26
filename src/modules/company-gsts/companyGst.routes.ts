import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { CompanyGstController } from './companyGst.controller.js';
import { createCompanyGstSchema, updateCompanyGstSchema } from './companyGst.validator.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get('/', CompanyGstController.getAll);
router.get('/:id', CompanyGstController.getById);

router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createCompanyGstSchema),
  CompanyGstController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateCompanyGstSchema),
  CompanyGstController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CompanyGstController.delete,
);

// Address history
router.post('/:id/addresses', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), CompanyGstController.addAddress);
router.put('/:id/addresses/:addressId', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), CompanyGstController.updateAddress);
router.delete('/:id/addresses/:addressId', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), CompanyGstController.removeAddress);

// E-invoice credentials
router.put('/:id/e-invoice', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), CompanyGstController.saveEInvoice);

export default router;
