import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole, UserType } from '../../shared/types.js';
import { CompanyController } from './company.controller.js';
import { createCompanySchema, updateCompanySchema } from './company.validator.js';

const router = Router();

router.use(authenticate);

// Any authenticated user can view their own company
router.get('/me', CompanyController.getMyCompany);

// Returns the accessible companies (parent + siblings in scope) for the
// context switcher. Visible to every authenticated user — the controller
// already scopes to what they're allowed to see.
router.get('/group', CompanyController.getGroup);

// List companies — visible to anyone with a tenant context. The result
// is scoped to the caller's accessibleCompanyIds, so an admin / site_admin
// only sees their own group.
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserType.ADMIN, UserType.SITE_ADMIN, UserType.HO_USER),
  CompanyController.getAll,
);

router.get(
  '/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserType.ADMIN, UserType.SITE_ADMIN, UserType.HO_USER),
  CompanyController.getById,
);

// Company create / update / delete is restricted to super_admin only —
// platform super_admin creates MAIN companies, company-level super_admin
// (userType=super_admin with a company) creates SIBLING companies under
// their parent group. The userType=super_admin path bypasses the role gate
// in authorize() automatically.
//
// Other userTypes — admin, ho_user, site_admin, user — cannot create or
// modify companies even though they may view the list.
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN),
  validate(createCompanySchema),
  CompanyController.create,
);

router.put(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  validate(updateCompanySchema),
  CompanyController.update,
);

router.delete(
  '/:id',
  authorize(UserRole.SUPER_ADMIN),
  CompanyController.delete,
);

export default router;
