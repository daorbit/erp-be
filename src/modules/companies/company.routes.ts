import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { CompanyController } from './company.controller.js';
import { createCompanySchema, updateCompanySchema } from './company.validator.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can view their own company
router.get('/me', CompanyController.getMyCompany);

// All other company routes require super_admin
router.use(authorize(UserRole.SUPER_ADMIN));

router.get('/', CompanyController.getAll);
router.get('/:id', CompanyController.getById);

router.post(
  '/',
  validate(createCompanySchema),
  CompanyController.create,
);

router.put(
  '/:id',
  validate(updateCompanySchema),
  CompanyController.update,
);

router.delete('/:id', CompanyController.delete);

export default router;
