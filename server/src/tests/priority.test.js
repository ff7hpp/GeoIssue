import { describe, expect, it } from "vitest";
import { priorityFromSupporterCount } from "../shared/priority.js";

describe("supporter-based priority", () => {
  it.each([
    [0, "low"],
    [1, "low"],
    [2, "medium"],
    [4, "medium"],
    [5, "high"],
    [9, "high"],
    [10, "urgent"]
  ])("maps %i supporters to %s", (supporters, priority) => {
    expect(priorityFromSupporterCount(supporters)).toBe(priority);
  });
});
