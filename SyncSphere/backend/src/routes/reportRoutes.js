import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All report endpoints require active session
router.use(requireAuth);

router.get('/dashboard', reportController.getDashboardMetrics);
router.get('/projects/:projectId/progress', reportController.getProgressReport);
router.get('/projects/:projectId/tasks', reportController.getTaskCompletionReport);
router.get('/teams/:teamId/usage', reportController.getTeamUsageReport);
router.get('/projects/:projectId/saved', reportController.getSavedReports);

export default router;
