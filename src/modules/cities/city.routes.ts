import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { validate } from '../../middleware/validate.js';
import { UserRole } from '../../shared/types.js';
import { CityController } from './city.controller.js';
import { createCitySchema, updateCitySchema } from './city.validator.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', CityController.getAll);
router.get('/:id', CityController.getById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(createCitySchema), CityController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), validate(updateCitySchema), CityController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), CityController.delete);
export default router;
