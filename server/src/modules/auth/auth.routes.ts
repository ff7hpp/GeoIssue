import { Router } from 'express';
import {
  authController,
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';

const router = Router();

// Public auth routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);

// Protected profile routes
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, validateBody(updateProfileSchema), authController.updateProfile);

export default router;
