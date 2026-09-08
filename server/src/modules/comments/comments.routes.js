import { Router } from "express";
import { z } from "zod";
import { commentsService } from "./comments.service.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
const createCommentSchema = z.object({
  content: z.string().min(2, "Comment must be at least 2 characters").max(1e3, "Comment must be under 1000 characters")
});
const router = Router({ mergeParams: true });
router.get("/", async (req, res, next) => {
  try {
    const comments = await commentsService.getCommentsByIssue(req.params.id);
    res.json({ data: comments });
  } catch (err) {
    next(err);
  }
});
router.post(
  "/",
  authenticate,
  validateBody(createCommentSchema),
  async (req, res, next) => {
    try {
      const comment = await commentsService.addComment(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body.content
      );
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  }
);
router.delete(
  "/:commentId",
  authenticate,
  async (req, res, next) => {
    try {
      await commentsService.deleteComment(
        req.params.commentId,
        req.user.id,
        req.user.role
      );
      res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  }
);
var stdin_default = router;
export {
  stdin_default as default
};
