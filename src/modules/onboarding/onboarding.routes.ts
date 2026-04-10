import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { requireCompany } from '../../middleware/companyScope.js';
import { UserRole } from '../../shared/types.js';
import { OnboardingController } from './onboarding.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireCompany);

// Self routes (any authenticated user with company)
router.get('/me', OnboardingController.getMe);
router.patch('/me/step/:step', OnboardingController.saveStep);
router.post('/me/submit', OnboardingController.submit);

// Admin routes
router.get('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), OnboardingController.getAll);
router.get('/:userId', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), OnboardingController.getByUser);
router.patch('/:userId/step/:step', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), OnboardingController.adminSaveStep);
router.post('/:userId/submit', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), OnboardingController.adminSubmit);
router.put('/:userId', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), OnboardingController.adminUpdate);
router.delete('/:userId', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), OnboardingController.delete);
router.patch('/:userId/review', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER), OnboardingController.review);

export default router;
