import { z } from "zod";
import { reportsService } from "./reports.service.js";
import { imageReferenceSchema } from "../../shared/image.validation.js";
const createReportSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  description: z.string().trim().min(5, "Description must be at least 5 characters").max(2e3),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  image_url: imageReferenceSchema,
  title: z.string().max(255).optional()
});
const updateReportSchema = z.object({
  description: z.string().trim().min(5).max(2e3).optional(),
  image_url: imageReferenceSchema
});
const reportsController = {
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await reportsService.createReport(userId, req.body);
      res.status(201).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  },
  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const updated = await reportsService.updateReport(
        req.params.id,
        userId,
        userRole,
        req.body
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      await reportsService.deleteReport(req.params.id, userId, userRole);
      res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  }
};
export {
  createReportSchema,
  reportsController,
  updateReportSchema
};
