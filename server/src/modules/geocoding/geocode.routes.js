import { Router } from "express";
import { geocodeController } from "./geocode.controller.js";
const router = Router();
router.get("/", geocodeController.search);
router.get("/reverse", geocodeController.reverse);
var stdin_default = router;
export {
  stdin_default as default
};
