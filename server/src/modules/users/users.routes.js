import { Router } from "express";
import {
  usersController,
  syncUserSchema,
  updateSettingsSchema
} from "./users.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
const router = Router();
router.get("/me", authenticate, usersController.getMe);
router.post("/me/sync", authenticate, validateBody(syncUserSchema), usersController.syncMe);
router.patch("/me", authenticate, validateBody(updateSettingsSchema), usersController.updateMe);
router.get("/me/reports", authenticate, usersController.getMyReports);
var stdin_default = router;
export {
  stdin_default as default
};
