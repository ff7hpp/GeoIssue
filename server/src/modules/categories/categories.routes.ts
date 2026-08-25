import { Router } from 'express';
import { categoriesController } from './categories.controller.js';

const router = Router();

router.get('/', categoriesController.list);
router.get('/:id', categoriesController.getById);

export default router;
