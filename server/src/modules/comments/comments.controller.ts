import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { commentsService } from './comments.service.js';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(2, 'Comment must be at least 2 characters')
    .max(1000, 'Comment must be under 1000 characters'),
});

export const commentsController = {
  async listByIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const issueId = req.params.id as string;
      const comments = await commentsService.getCommentsByIssue(issueId);
      res.json({ data: comments });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const issueId = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { content } = req.body;

      const comment = await commentsService.addComment(
        issueId,
        userId,
        userRole,
        content
      );
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = req.params.commentId as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      await commentsService.deleteComment(commentId, userId, userRole);
      res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  },
};
