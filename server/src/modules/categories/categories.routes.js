import { Router } from "express";
import { categoriesService } from "./categories.service.js";
const router = Router();
router.get("/", async (req, res, next) => {
  try {
    const onlyActive = req.query.all !== "true";
    const categories = await categoriesService.getAllCategories(onlyActive);
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
