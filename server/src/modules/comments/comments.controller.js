import { z } from "zod";
import { commentsService } from "./comments.service.js";
const createCommentSchema = z.object({
  content: z.string().min(2, "Comment must be at least 2 characters").max(1e3, "Comment must be under 1000 characters")
});
const commentsController = {
  async listByIssue(req, res, next) {
    try {
      const issueId = req.params.id;
      const comments = await commentsService.getCommentsByIssue(issueId);
      res.json({ data: comments });
    } catch (err) {
      next(err);
    }
  },
  async create(req, res, next) {
    try {
      const issueId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
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
  async delete(req, res, next) {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.id;
      const userRole = req.user.role;
      await commentsService.deleteComment(commentId, userId, userRole);
      res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  }
};
export {
  commentsController,
  createCommentSchema
};
