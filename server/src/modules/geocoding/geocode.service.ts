import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors.js';

export interface GeocodeResult {
  place_id: number | string;
  display_name: string;
  lat: number;
  lon: number;
  type?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export const geocodeService = {
  async search(query: string): Promise<GeocodeResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmedQuery
    )}&format=json&addressdetails=1&limit=5`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.geocodingTimeout);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'GeoIssue-CivicApp/1.0 (contact@geoissue.org)',
          'Accept-Language': 'en,ar,tr',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn(`Nominatim search returned status ${res.status}`);
        return [];
      }

      const data: any = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        address: item.address,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('Geocoding request timed out');
      } else {
        console.warn('Geocoding lookup failed:', err.message);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async reverse(lat: number, lon: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.geocodingTimeout);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'GeoIssue-CivicApp/1.0 (contact@geoissue.org)',
        },
        signal: controller.signal,
      });

      if (!res.ok) return null;
      const data: any = await res.json();
      return data.display_name || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
