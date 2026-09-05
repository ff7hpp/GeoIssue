import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  isWithinDistance
} from "../shared/haversine.js";
describe("Haversine Distance Calculations", () => {
  it("should return 0 meters for identical coordinates", () => {
    const lat = 39.925533;
    const lon = 32.866287;
    const distance = calculateHaversineDistance(lat, lon, lat, lon);
    expect(distance).toBe(0);
  });
  it("should accurately calculate distance for nearby urban coordinates", () => {
    const p1 = { lat: 39.925533, lon: 32.866287 };
    const p2 = { lat: 39.9258, lon: 32.8665 };
    const distance = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
    expect(distance).toBeGreaterThan(30);
    expect(distance).toBeLessThan(45);
  });
  it("should correctly evaluate distance threshold matching (<= 50m)", () => {
    const base = { lat: 39.925533, lon: 32.866287 };
    const near = { lat: 39.9257, lon: 32.8664 };
    const far = { lat: 39.9275, lon: 32.868 };
    expect(isWithinDistance(base.lat, base.lon, near.lat, near.lon, 50)).toBe(true);
    expect(isWithinDistance(base.lat, base.lon, far.lat, far.lon, 50)).toBe(false);
  });
  it("should handle coordinate boundaries properly without NaN", () => {
    const d1 = calculateHaversineDistance(0, 0, 0, 180);
    expect(isNaN(d1)).toBe(false);
    expect(d1).toBeGreaterThan(19e6);
  });
});
