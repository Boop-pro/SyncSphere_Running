import { Router } from 'express';
import * as calendarController from '../controllers/calendarController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All calendar operations require active session
router.use(requireAuth);

// Personal Calendar endpoints
router.post('/personal', calendarController.createPersonalEvent);
router.get('/personal', calendarController.getPersonalEvents);
router.put('/personal/:id', calendarController.updatePersonalEvent);
router.delete('/personal/:id', calendarController.deletePersonalEvent);

// Shared Team Calendar feed
router.get('/shared/:teamId', calendarController.getSharedCalendarEvents);

export default router;
