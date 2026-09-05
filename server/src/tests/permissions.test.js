import { describe, it, expect } from "vitest";
import { requireRole } from "../middleware/auth.middleware.js";
import { AppError } from "../shared/errors.js";
describe("Server Role Permission Middleware", () => {
  const visitorUser = {
    id: "u-1",
    firebase_uid: "f-1",
    email: "visitor@example.com",
    display_name: "Visitor",
    role: "visitor",
    language: "en",
    account_status: "active",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const regularUser = {
    id: "u-2",
    firebase_uid: "f-2",
    email: "user@example.com",
    display_name: "Citizen",
    role: "user",
    language: "en",
    account_status: "active",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const adminUser = {
    id: "u-3",
    firebase_uid: "f-3",
    email: "admin@example.com",
    display_name: "Admin",
    role: "admin",
    language: "en",
    account_status: "active",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  it("should block unauthenticated requests with 401 UNAUTHENTICATED", () => {
    const middleware = requireRole("user", "admin");
    const req = {};
    const res = {};
    let caughtError = null;
    middleware(req, res, (err) => {
      caughtError = err;
    });
    expect(caughtError).toBeInstanceOf(AppError);
    expect(caughtError.statusCode).toBe(401);
    expect(caughtError.code).toBe("UNAUTHENTICATED");
  });
  it("should block visitor from accessing user-only route with 403 FORBIDDEN", () => {
    const middleware = requireRole("user", "admin");
    const req = { user: visitorUser };
    const res = {};
    let caughtError = null;
    middleware(req, res, (err) => {
      caughtError = err;
    });
    expect(caughtError).toBeInstanceOf(AppError);
    expect(caughtError.statusCode).toBe(403);
    expect(caughtError.code).toBe("FORBIDDEN");
  });
  it("should allow user accessing user-allowed route", () => {
    const middleware = requireRole("user", "admin");
    const req = { user: regularUser };
    const res = {};
    let calledNext = false;
    middleware(req, res, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });
  it("should block regular user from admin route with 403 FORBIDDEN", () => {
    const middleware = requireRole("admin");
    const req = { user: regularUser };
    const res = {};
    let caughtError = null;
    middleware(req, res, (err) => {
      caughtError = err;
    });
    expect(caughtError).toBeInstanceOf(AppError);
    expect(caughtError.statusCode).toBe(403);
    expect(caughtError.code).toBe("FORBIDDEN");
  });
  it("should allow admin accessing admin route", () => {
    const middleware = requireRole("admin");
    const req = { user: adminUser };
    const res = {};
    let calledNext = false;
    middleware(req, res, () => {
      calledNext = true;
    });
    expect(calledNext).toBe(true);
  });
});
