import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service.js';

export const categoriesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const onlyActive = req.query.all !== 'true';
      const categories = await categoriesService.getAllCategories(onlyActive);
      res.json({ data: categories });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoriesService.getCategoryById(req.params.id as string);
      res.json({ data: category });
    } catch (err) {
      next(err);
    }
  },
};
