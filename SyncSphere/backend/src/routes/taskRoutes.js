import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadAttachment } from '../middleware/upload.js';

const router = Router();

// All task routes require authenticated session
router.use(requireAuth);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks); // expects ?projectId=...
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id/status', taskController.updateTaskStatus);
router.delete('/:id', taskController.deleteTask);

// Comments
router.post('/:id/comments', taskController.addComment);

// File Attachments
router.post(
  '/:id/attachments',
  uploadAttachment.single('file'),
  taskController.uploadAttachment
);
router.delete('/:id/attachments/:attachmentId', taskController.deleteAttachment);

export default router;
