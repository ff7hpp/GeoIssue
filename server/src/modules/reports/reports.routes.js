import { Router } from "express";
import {
  reportsController,
  createReportSchema,
  updateReportSchema
} from "./reports.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
const router = Router();
router.post(
  "/",
  authenticate,
  validateBody(createReportSchema),
  reportsController.create
);
router.put(
  "/:id",
  authenticate,
  validateBody(updateReportSchema),
  reportsController.update
);
router.delete("/:id", authenticate, reportsController.delete);
var stdin_default = router;
export {
  stdin_default as default
};
