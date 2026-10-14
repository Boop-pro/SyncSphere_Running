import { Router } from 'express';
import * as discussionController from '../controllers/discussionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All discussion operations require authenticated session
router.use(requireAuth);

router.get('/projects/:projectId', discussionController.getDiscussionBoard);
router.post('/projects/:projectId', discussionController.createPost);
router.put('/:id', discussionController.updatePost);
router.delete('/:id', discussionController.deletePost);

export default router;
