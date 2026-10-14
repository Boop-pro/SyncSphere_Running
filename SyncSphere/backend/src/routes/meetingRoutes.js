import { Router } from 'express';
import * as meetingController from '../controllers/meetingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All meeting operations require active session
router.use(requireAuth);

router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getMeetings); // expects ?teamId=...
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.cancelMeeting);

export default router;
