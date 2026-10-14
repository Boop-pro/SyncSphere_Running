import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

// Protected User Profile endpoints
router.get('/profile', requireAuth, userController.getProfile);
router.put('/profile', requireAuth, userController.updateProfile);
router.post('/change-password', requireAuth, userController.changePassword);

// Admin-only endpoints
router.get('/', requireAuth, requireAdmin, userController.getAllUsers);
router.patch('/:id/role', requireAuth, requireAdmin, userController.updateUserRole);

export default router;
