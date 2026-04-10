import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { UserRole } from '../../shared/types.js';
import { AuditController } from './audit.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', AuditController.getAll);

export default router;
