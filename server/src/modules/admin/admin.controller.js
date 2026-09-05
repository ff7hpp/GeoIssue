import { adminService } from "./admin.service.js";
import { z } from "zod";
const updateStatusSchema = z.object({
  status: z.enum([
    "submitted",
    "in_review",
    "accepted",
    "in_progress",
    "resolved",
    "rejected"
  ]),
  note: z.string().max(1e3).optional()
});
const updatePrioritySchema = z.object({
  priority: z.enum(["low", "medium", "high", "urgent"])
});
const assignIssueSchema = z.object({
  assignee_id: z.string().uuid().nullable()
});
const updateUserSchema = z.object({
  role: z.enum(["visitor", "user", "admin"]).optional(),
  account_status: z.enum(["active", "suspended", "pending"]).optional()
});
const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  icon: z.string().min(1).max(50)
});
const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(100).optional(),
  icon: z.string().min(1).max(50).optional(),
  is_active: z.boolean().optional()
});
const adminController = {
  async listIssues(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const status = req.query.status;
      const categoryId = req.query.category_id;
      const search = req.query.search;
      const { issues, total } = await adminService.listAllIssues({
        page,
        limit,
        status,
        categoryId,
        search
      });
      res.json({
        data: issues,
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
  },
  async updateStatus(req, res, next) {
    try {
      const adminUserId = req.user.id;
      const { status, note } = req.body;
      const updated = await adminService.updateIssueStatus(
        req.params.id,
        status,
        adminUserId,
        note
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
  async updatePriority(req, res, next) {
    try {
      const { priority } = req.body;
      const updated = await adminService.updateIssuePriority(
        req.params.id,
        priority
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
  async assignIssue(req, res, next) {
    try {
      const { assignee_id } = req.body;
      await adminService.assignIssue(req.params.id, assignee_id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
  async listUsers(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const { users, total } = await adminService.listAllUsers(page, limit);
      res.json({
        data: users,
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
  },
  async updateUser(req, res, next) {
    try {
      const updated = await adminService.updateUser(req.params.id, req.body);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
  async createCategory(req, res, next) {
    try {
      const category = await adminService.createCategory(req.body);
      res.status(201).json({ data: category });
    } catch (err) {
      next(err);
    }
  },
  async updateCategory(req, res, next) {
    try {
      const category = await adminService.updateCategory(
        req.params.id,
        req.body
      );
      res.json({ data: category });
    } catch (err) {
      next(err);
    }
  }
};
export {
  adminController,
  assignIssueSchema,
  createCategorySchema,
  updateCategorySchema,
  updatePrioritySchema,
  updateStatusSchema,
  updateUserSchema
};
