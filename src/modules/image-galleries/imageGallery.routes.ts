import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { ImageGalleryController } from './imageGallery.controller.js';

const router = Router();
router.use(authenticate); router.use(requireCompany);
router.get('/', ImageGalleryController.getAll);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ImageGalleryController.create);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ImageGalleryController.update);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), ImageGalleryController.delete);
export default router;
