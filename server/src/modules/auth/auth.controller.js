import { z } from "zod";
import { authService } from "./auth.service.js";
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  language: z.enum(["en", "ar", "tr"]).optional().default("en")
});
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  language: z.enum(["en", "ar", "tr"]).optional(),
  avatar_url: z.string().url().nullable().optional(),
  current_password: z.string().optional(),
  new_password: z.string().min(6, "New password must be at least 6 characters").optional()
});
const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  }
};
export {
  authController,
  loginSchema,
  registerSchema,
  updateProfileSchema
};
