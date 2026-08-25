import { Router } from 'express';
import { issuesController } from './issues.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', issuesController.list);
router.get('/:id', optionalAuth, issuesController.getById);

export default router;
