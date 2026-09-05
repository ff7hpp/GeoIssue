import { Router } from "express";
import { categoriesController } from "./categories.controller.js";
const router = Router();
router.get("/", categoriesController.list);
router.get("/:id", categoriesController.getById);
var stdin_default = router;
export {
  stdin_default as default
};
