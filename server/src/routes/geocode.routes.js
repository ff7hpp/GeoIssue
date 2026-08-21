import express from "express";

const router = express.Router();
const cache = new Map();
const reverseCache = new Map();
let lastRequestAt = 0;

async function respectRateLimit() {
  const waitTime = Math.max(0, 1100 - (Date.now() - lastRequestAt));
  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestAt = Date.now();
}

function searchVariants(query) {
  const expanded = query
    .replace(/\buni\.?\b/gi, "University")
    .replace(/\buniv\.?\b/gi, "University");

  return [...new Set([query, expanded])];
}

async function searchNominatim(query) {
  await respectRateLimit();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "tr");
  url.searchParams.set("accept-language", "tr,en");

  const response = await fetch(url, {
    headers: { "User-Agent": "GeoIssue-Internship-Project/1.0" },
  });

  if (!response.ok) {
    throw new Error("Location service is unavailable.");
  }

  return response.json();
}

router.get("/", async (req, res, next) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!query || query.length < 2 || query.length > 120) {
      return res.status(400).json({ message: "Enter between 2 and 120 characters." });
    }

    const cacheKey = query.toLowerCase();
    if (cache.has(cacheKey)) {
      return res.json({ results: cache.get(cacheKey) });
    }

    let data = [];
    for (const variant of searchVariants(query)) {
      data = await searchNominatim(variant);
      if (data.length > 0) break;
    }

    const results = data.map((place) => ({
      id: place.place_id,
      name: place.display_name,
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    }));

    cache.set(cacheKey, results);
    return res.json({ results });
  } catch (error) {
    return next(error);
  }
});

router.get("/reverse", async (req, res, next) => {
  try {
    const latitude = Number(req.query.lat);
    const longitude = Number(req.query.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (reverseCache.has(cacheKey)) {
      return res.json(reverseCache.get(cacheKey));
    }

    await respectRateLimit();
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", latitude);
    url.searchParams.set("lon", longitude);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "tr,en");

    const response = await fetch(url, {
      headers: { "User-Agent": "GeoIssue-Internship-Project/1.0" },
    });

    if (!response.ok) {
      throw new Error("Address lookup is unavailable.");
    }

    const place = await response.json();
    const result = {
      name: place.display_name || "No mapped address found for this point.",
      latitude,
      longitude,
    };

    reverseCache.set(cacheKey, result);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

export default router;
