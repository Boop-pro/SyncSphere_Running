import { Router } from 'express';
import * as teamController from '../controllers/teamController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All team routes require an active authenticated session
router.use(requireAuth);

router.post('/', teamController.createTeam);
router.get('/my', teamController.getMyTeams);
router.get('/:id', teamController.getTeamById);
router.delete('/:id', teamController.deleteTeam);

// Member management
router.post('/:id/members', teamController.addMember);
router.patch('/:id/members/:userId/role', teamController.updateMemberRole);
router.delete('/:id/members/:userId', teamController.removeMember);

export default router;
