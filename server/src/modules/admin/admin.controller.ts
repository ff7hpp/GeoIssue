import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { z } from 'zod';
import { IssuePriority, IssueStatus } from '../../shared/types.js';

export const updateStatusSchema = z.object({
  status: z.enum([
    'submitted',
    'in_review',
    'accepted',
    'in_progress',
    'resolved',
    'rejected',
  ]),
  note: z.string().max(1000).optional(),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const updateUserSchema = z.object({
  role: z.enum(['visitor', 'user', 'admin']).optional(),
  account_status: z.enum(['active', 'suspended', 'pending']).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  icon: z.string().min(1).max(50),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).optional(),
  icon: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional(),
});

export const adminController = {
  async listIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as IssueStatus | undefined;
      const categoryId = req.query.category_id as string | undefined;
      const search = req.query.search as string | undefined;

      const { issues, total } = await adminService.listAllIssues({
        page,
        limit,
        status,
        categoryId,
        search,
      });

      res.json({
        data: issues,
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

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user!.id;
      const { status, note } = req.body;
      const updated = await adminService.updateIssueStatus(
        req.params.id as string,
        status,
        adminUserId,
        note
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async updatePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { priority } = req.body;
      const updated = await adminService.updateIssuePriority(
        req.params.id as string,
        priority
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const { users, total } = await adminService.listAllUsers(page, limit);
      res.json({
        data: users,
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

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await adminService.updateUser(req.params.id as string, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await adminService.createCategory(req.body);
      res.status(201).json({ data: category });
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await adminService.updateCategory(
        req.params.id as string,
        req.body
      );
      res.json({ data: category });
    } catch (err) {
      next(err);
    }
  },
};
