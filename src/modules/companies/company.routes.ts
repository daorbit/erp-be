import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { CompanyController } from './company.controller.js';
import { createCompanySchema, updateCompanySchema } from './company.validator.js';

const router = Router();

// All company routes require super_admin
router.use(authenticate);
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
