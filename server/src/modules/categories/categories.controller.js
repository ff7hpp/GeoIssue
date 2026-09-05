import { categoriesService } from "./categories.service.js";
const categoriesController = {
  async list(req, res, next) {
    try {
      const onlyActive = req.query.all !== "true";
      const categories = await categoriesService.getAllCategories(onlyActive);
      res.json({ data: categories });
    } catch (err) {
      next(err);
    }
  },
  async getById(req, res, next) {
    try {
      const category = await categoriesService.getCategoryById(req.params.id);
      res.json({ data: category });
    } catch (err) {
      next(err);
    }
  }
};
export {
  categoriesController
};
