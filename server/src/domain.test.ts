import assert from "node:assert/strict";
import test from "node:test";
import { canTransition, hasRole, haversineMeters } from "./domain.js";

test("Haversine distance keeps a 50m match threshold honest", () => {
  const meters = haversineMeters(39.9334, 32.8597, 39.93385, 32.8597);
  assert.ok(meters > 40 && meters < 55);
});
test("issue lifecycle allows only explicit transitions", () => {
  assert.equal(canTransition("submitted", "in_review"), true);
  assert.equal(canTransition("submitted", "resolved"), false);
  assert.equal(canTransition("resolved", "submitted"), false);
});
test("admin inherits user permissions but user does not inherit admin", () => {
  assert.equal(hasRole({ role: "admin" }, "user"), true);
  assert.equal(hasRole({ role: "user" }, "admin"), false);
});
