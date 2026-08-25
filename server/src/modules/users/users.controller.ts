import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service.js';
import { z } from 'zod';

export const syncUserSchema = z.object({
  firebase_uid: z.string().optional(),
  email: z.string().email().optional(),
  display_name: z.string().nullable().optional(),
  language: z.enum(['en', 'ar', 'tr']).optional(),
});

export const updateSettingsSchema = z.object({
  display_name: z.string().min(2).max(100).optional(),
  language: z.enum(['en', 'ar', 'tr']).optional(),
});

export const usersController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getProfile(req.user!.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async syncMe(req: Request, res: Response, next: NextFunction) {
    try {
      const firebaseUid = req.body.firebase_uid || req.firebaseUid || req.user?.firebase_uid;
      const email = req.body.email || req.firebaseEmail || req.user?.email;

      if (!firebaseUid || !email) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Firebase UID and email are required for sync',
          },
        });
      }

      const user = await usersService.syncUser({
        firebase_uid: firebaseUid,
        email,
        display_name: req.body.display_name ?? req.user?.display_name,
        language: req.body.language,
      });

      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await usersService.updateSettings(req.user!.id, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async getMyReports(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { reports, total } = await usersService.getUserReports(
        req.user!.id,
        page,
        limit
      );

      res.json({
        data: reports,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
