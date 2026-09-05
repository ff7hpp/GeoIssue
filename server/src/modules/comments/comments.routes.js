import { Router } from "express";
import { commentsController, createCommentSchema } from "./comments.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
const router = Router({ mergeParams: true });
router.get("/", commentsController.listByIssue);
router.post(
  "/",
  authenticate,
  validateBody(createCommentSchema),
  commentsController.create
);
router.delete(
  "/:commentId",
  authenticate,
  commentsController.delete
);
var stdin_default = router;
export {
  stdin_default as default
};
