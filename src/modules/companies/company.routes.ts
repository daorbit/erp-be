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

// Returns the parent + all sibling companies for the context switcher
router.get('/group', CompanyController.getGroup);

// List all companies in the caller's group (or all, for super_admin)
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CompanyController.getAll,
);

router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CompanyController.getById,
);

// Super Admin creates main companies; Admin creates sibling companies
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(createCompanySchema),
  CompanyController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate(updateCompanySchema),
  CompanyController.update,
);

// Super Admin can delete any company; Admin can delete only sibling companies
router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CompanyController.delete,
);

export default router;
