import { Router } from 'express';
import { geocodeController } from './geocode.controller.js';

const router = Router();

router.get('/', geocodeController.search);
router.get('/reverse', geocodeController.reverse);

export default router;
