import { geocodeService } from "./geocode.service.js";
const geocodeController = {
  async search(req, res, next) {
    try {
      const q = typeof req.query.q === "string" ? req.query.q.slice(0, 200) : "";
      const results = await geocodeService.search(q);
      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  },
  async reverse(req, res, next) {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
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
