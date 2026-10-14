import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All project routes require an active authenticated session
router.use(requireAuth);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects); // expects ?teamId=...
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Milestones
router.post('/:id/milestones', projectController.createMilestone);
router.put('/:id/milestones/:milestoneId', projectController.updateMilestone);
router.delete('/:id/milestones/:milestoneId', projectController.deleteMilestone);

export default router;
