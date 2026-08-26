import { Router } from 'express';
import { commentsController, createCommentSchema } from './comments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';

const router = Router({ mergeParams: true });

// Public view of comments
router.get('/', commentsController.listByIssue);

// Add comment requires authenticated user
router.post(
  '/',
  authenticate,
  validateBody(createCommentSchema),
  commentsController.create
);

// Delete comment requires owner or admin
router.delete(
  '/:commentId',
  authenticate,
  commentsController.delete
);

export default router;
