import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  authController,
  registerSchema,
  loginSchema,
  updateProfileSchema
} from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication attempts, please try again later"
    }
  }
});
router.post("/register", authLimiter, validateBody(registerSchema), authController.register);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);
router.put("/profile", authenticate, validateBody(updateProfileSchema), authController.updateProfile);
var stdin_default = router;
export {
  stdin_default as default
};
