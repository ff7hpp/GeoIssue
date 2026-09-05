import { usersService } from "./users.service.js";
import { z } from "zod";
const syncUserSchema = z.object({
  display_name: z.string().nullable().optional(),
  language: z.enum(["en", "ar", "tr"]).optional()
});
const updateSettingsSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  language: z.enum(["en", "ar", "tr"]).optional()
});
const usersController = {
  async getMe(req, res, next) {
    try {
      const user = await usersService.getProfile(req.user.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
  async syncMe(req, res, next) {
    try {
      const user = await usersService.syncUser(req.user.id, {
        display_name: req.body.display_name ?? req.user?.display_name,
        language: req.body.language
      });
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
  async updateMe(req, res, next) {
    try {
      const updated = await usersService.updateSettings(req.user.id, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
  async getMyReports(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const { reports, total } = await usersService.getUserReports(
        req.user.id,
        page,
        limit
      );
      res.json({
        data: reports,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
export {
  syncUserSchema,
  updateSettingsSchema,
  usersController
};
