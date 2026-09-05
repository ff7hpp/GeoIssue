import { Router } from "express";
import { issuesController } from "./issues.controller.js";
import { optionalAuth } from "../../middleware/auth.middleware.js";
const router = Router();
router.get("/", issuesController.list);
router.get("/:id", optionalAuth, issuesController.getById);
var stdin_default = router;
export {
  stdin_default as default
};
