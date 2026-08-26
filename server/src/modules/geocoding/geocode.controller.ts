import { Request, Response, NextFunction } from 'express';
import { geocodeService } from './geocode.service.js';

export const geocodeController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      const results = await geocodeService.search(q);
      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  },

  async reverse(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid lat and lon query parameters are required',
          },
        });
      }

      const address = await geocodeService.reverse(lat, lon);
      res.json({ data: { address } });
    } catch (err) {
      next(err);
    }
  },
};
