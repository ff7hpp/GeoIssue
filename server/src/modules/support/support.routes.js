import { Router } from "express";
import { supportController } from "./support.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
const router = Router({ mergeParams: true });
router.post("/", authenticate, supportController.addSupport);
router.delete("/", authenticate, supportController.removeSupport);
var stdin_default = router;
export {
  stdin_default as default
};
