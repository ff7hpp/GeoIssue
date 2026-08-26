import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reportsService } from './reports.service.js';

export const createReportSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  image_url: z.string().nullable().optional(),
  title: z.string().max(255).optional(),
});

export const updateReportSchema = z.object({
  description: z.string().min(5).max(2000).optional(),
  image_url: z.string().nullable().optional(),
});

export const reportsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await reportsService.createReport(userId, req.body);
      res.status(201).json({
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const updated = await reportsService.updateReport(
        req.params.id as string,
        userId,
        userRole,
        req.body
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      await reportsService.deleteReport(req.params.id as string, userId, userRole);
      res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  },
};
