import { Router } from 'express';
import {
  adminController,
  updateStatusSchema,
  updatePrioritySchema,
  updateUserSchema,
  createCategorySchema,
  updateCategorySchema,
} from './admin.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';

const router = Router();

// Protect entire admin router with admin role requirement
router.use(authenticate, requireRole('admin'));

router.get('/issues', adminController.listIssues);
router.patch(
  '/issues/:id/status',
  validateBody(updateStatusSchema),
  adminController.updateStatus
);
router.patch(
  '/issues/:id/priority',
  validateBody(updatePrioritySchema),
  adminController.updatePriority
);

router.get('/users', adminController.listUsers);
router.patch(
  '/users/:id',
  validateBody(updateUserSchema),
  adminController.updateUser
);

router.post(
  '/categories',
  validateBody(createCategorySchema),
  adminController.createCategory
);
router.patch(
  '/categories/:id',
  validateBody(updateCategorySchema),
  adminController.updateCategory
);

export default router;
