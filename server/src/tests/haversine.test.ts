import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  isWithinDistance,
} from '../shared/haversine.js';

describe('Haversine Distance Calculations', () => {
  it('should return 0 meters for identical coordinates', () => {
    const lat = 39.925533;
    const lon = 32.866287;
    const distance = calculateHaversineDistance(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });

  it('should accurately calculate distance for nearby urban coordinates', () => {
    // Two points roughly ~35-40 meters apart in Ankara
    const p1 = { lat: 39.925533, lon: 32.866287 };
    const p2 = { lat: 39.925800, lon: 32.866500 };

    const distance = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
    expect(distance).toBeGreaterThan(30);
    expect(distance).toBeLessThan(45);
  });

  it('should correctly evaluate distance threshold matching (<= 50m)', () => {
    const base = { lat: 39.925533, lon: 32.866287 };
    // Small delta ~25m
    const near = { lat: 39.925700, lon: 32.866400 };
    // Larger delta ~250m
    const far = { lat: 39.927500, lon: 32.868000 };

    expect(isWithinDistance(base.lat, base.lon, near.lat, near.lon, 50)).toBe(true);
    expect(isWithinDistance(base.lat, base.lon, far.lat, far.lon, 50)).toBe(false);
  });

  it('should handle coordinate boundaries properly without NaN', () => {
    const d1 = calculateHaversineDistance(0, 0, 0, 180);
    expect(isNaN(d1)).toBe(false);
    expect(d1).toBeGreaterThan(19000000); // Half earth circumference ~20,000 km
  });
});
