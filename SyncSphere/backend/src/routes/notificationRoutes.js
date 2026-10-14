import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All notification operations require active session
router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.post('/reminders', notificationController.createReminder);
router.patch('/:id/read', notificationController.markRead);
router.post('/mark-all-read', notificationController.markAllRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
