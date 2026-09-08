import { describe, it, expect } from "vitest";
import { imageReferenceSchema } from "../shared/image.validation.js";
import { createReportSchema } from "../modules/reports/reports.controller.js";
describe("Report image and description validation", () => {
  it("rejects active content, disguised files and oversized payloads", () => {
    for (const input of ["javascript:alert(1)", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,aGVsbG8=", "x".repeat(3 * 1024 * 1024 + 1)]) {
      expect(imageReferenceSchema.safeParse(input).success).toBe(false);
    }
  });
  it("accepts supported image signatures and existing HTTP references", () => {
    for (const input of ["https://example.com/evidence.png", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "data:image/jpeg;base64,/9j/4A==", "data:image/webp;base64,UklGRgAAAABXRUJQ"]) {
      expect(imageReferenceSchema.safeParse(input).success).toBe(true);
    }
  });
  it("rejects whitespace-only descriptions", () => {
    expect(createReportSchema.safeParse({ category_id: "road", description: "      ", latitude: 39, longitude: 32 }).success).toBe(false);
  });
  it("accepts Istanbul coordinates and rejects locations outside Istanbul", () => {
    const report = {
      category_id: "road",
      description: "A valid issue description",
      latitude: 41.0082,
      longitude: 28.9784
    };
    expect(createReportSchema.safeParse(report).success).toBe(true);
    expect(createReportSchema.safeParse({ ...report, latitude: 39.9334, longitude: 32.8597 }).success).toBe(false);
  });
});
