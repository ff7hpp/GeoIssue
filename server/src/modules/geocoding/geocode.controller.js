import { geocodeService } from "./geocode.service.js";
const geocodeController = {
  async search(req, res, next) {
    try {
      const q = req.query.q || "";
      const results = await geocodeService.search(q);
      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  },
  async reverse(req, res, next) {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid lat and lon query parameters are required"
          }
        });
      }
      const address = await geocodeService.reverse(lat, lon);
      res.json({ data: { address } });
    } catch (err) {
      next(err);
    }
  }
};
export {
  geocodeController
};
