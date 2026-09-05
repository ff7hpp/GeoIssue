import { config } from "../../config/env.js";
const geocodeService = {
  async search(query) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const trimmedQuery = query.trim();
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmedQuery
    )}&format=json&addressdetails=1&countrycodes=tr&limit=5`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.geocodingTimeout);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "GeoIssue-CivicApp/1.0 (contact@geoissue.org)",
          "Accept-Language": "en,ar,tr"
        },
        signal: controller.signal
      });
      if (!res.ok) {
        console.warn(`Nominatim search returned status ${res.status}`);
        return [];
      }
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        address: item.address
      }));
    } catch (err) {
      if (err.name === "AbortError") {
        console.warn("Geocoding request timed out");
      } else {
        console.warn("Geocoding lookup failed:", err.message);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  },
  async reverse(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.geocodingTimeout);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "GeoIssue-CivicApp/1.0 (contact@geoissue.org)"
        },
        signal: controller.signal
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.display_name || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
export {
  geocodeService
};
