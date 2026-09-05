import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../app.js";
import { initDb } from "../db/pool.js";
import { usersRepository } from "../modules/users/users.repository.js";
import { authService } from "../modules/auth/auth.service.js";
import { generateToken } from "../shared/auth.utils.js";
async function makeRequest(method, url, headers = {}, body) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      originalUrl: url,
      headers: { ...headers },
      body,
      query: {},
      params: {},
      socket: { remoteAddress: "127.0.0.1" },
      connection: { remoteAddress: "127.0.0.1" }
    };
    if (url.includes("?")) {
      const parts = url.split("?");
      req.url = parts[0];
      req.originalUrl = url;
      const searchParams = new URLSearchParams(parts[1]);
      for (const [k, v] of searchParams.entries()) {
        req.query[k] = v;
      }
    }
    let responseStatus = 200;
    let responseBody = null;
    const responseHeaders = /* @__PURE__ */ new Map();
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseBody = data;
        resolve({ status: responseStatus, body: responseBody });
        return this;
      },
      setHeader(name, value) {
        responseHeaders.set(name.toLowerCase(), value);
      },
      getHeader(name) {
        return responseHeaders.get(name.toLowerCase());
      },
      removeHeader(name) {
        responseHeaders.delete(name.toLowerCase());
      }
    };
    app(req, res, (err) => {
      if (err) {
        resolve({
          status: err.statusCode || 500,
          body: { error: { code: err.code || "INTERNAL_ERROR", message: err.message } }
        });
      } else {
        resolve({ status: responseStatus, body: responseBody });
      }
    });
  });
}
describe("API Smoke & Security Tests", () => {
  beforeAll(async () => {
    await initDb();
  });
  it("GET /api/health should return 200 with service info", async () => {
    const res = await makeRequest("GET", "/api/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("healthy");
  });
  it("GET /api/categories should be publicly accessible", async () => {
    const res = await makeRequest("GET", "/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
  it("GET /api/issues should be publicly accessible", async () => {
    const res = await makeRequest("GET", "/api/issues");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.page).toBe(1);
    for (const issue of res.body.data) {
      expect(issue.assigned_to).toBeUndefined();
      expect(issue.deleted_at).toBeUndefined();
      expect(issue.assignee?.id).toBeUndefined();
      expect(issue.assignee?.email).toBeUndefined();
      expect(issue.assignee?.avatar_url).toBeUndefined();
    }
  });
  it("GET /api/issues/:id should hide report and history user identifiers publicly", async () => {
    const list = await makeRequest("GET", "/api/issues");
    const issueId = list.body.data[0]?.id;
    if (!issueId) return;
    const res = await makeRequest("GET", `/api/issues/${issueId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.assigned_to).toBeUndefined();
    expect(res.body.data.deleted_at).toBeUndefined();
    for (const report of res.body.data.reports) {
      expect(report.user_id).toBeUndefined();
      expect(report.deleted_at).toBeUndefined();
      expect(report.user?.id).toBeUndefined();
    }
    for (const entry of res.body.data.history) {
      expect(entry.changed_by_user_id).toBeUndefined();
      expect(entry.changed_by?.id).toBeUndefined();
      if (entry.changed_by) {
        expect(["Administrator", "Citizen"]).toContain(entry.changed_by.display_name);
      }
    }
  });
  it("POST /api/reports without Authorization header should return 401 UNAUTHENTICATED", async () => {
    const res = await makeRequest("POST", "/api/reports", {}, {
      category_id: "c1",
      description: "Test pothole",
      latitude: 39.9,
      longitude: 32.8
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
  it("GET /api/me without Authorization header should return 401 UNAUTHENTICATED", async () => {
    const res = await makeRequest("GET", "/api/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
  it("GET /api/auth/me should reject invalid and expired tokens", async () => {
    const invalid = await makeRequest("GET", "/api/auth/me", {
      authorization: "Bearer definitely-not-a-valid-token"
    });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe("UNAUTHENTICATED");
    const registered = await authService.register({
      email: `expired_${Date.now()}@geoissue.local`,
      password: "StrongPassword123!",
      display_name: "Expired Token User"
    });
    const expiredToken = generateToken(
      {
        id: registered.user.id,
        email: registered.user.email,
        role: registered.user.role
      },
      -1
    );
    const expired = await makeRequest("GET", "/api/auth/me", {
      authorization: `Bearer ${expiredToken}`
    });
    expect(expired.status).toBe(401);
    expect(expired.body.error.code).toBe("UNAUTHENTICATED");
  });
  it("should restore a native JWT session and enforce suspended-user blocking", async () => {
    const registered = await authService.register({
      email: `session_${Date.now()}@geoissue.local`,
      password: "StrongPassword123!",
      display_name: "Session User"
    });
    const active = await makeRequest("GET", "/api/auth/me", {
      authorization: `Bearer ${registered.token}`
    });
    expect(active.status).toBe(200);
    expect(active.body.data.id).toBe(registered.user.id);
    const profile = await makeRequest("GET", "/api/me", {
      authorization: `Bearer ${registered.token}`
    });
    expect(profile.status).toBe(200);
    expect(profile.body.data.password_hash).toBeUndefined();
    await usersRepository.update(registered.user.id, { account_status: "suspended" });
    const suspended = await makeRequest("GET", "/api/auth/me", {
      authorization: `Bearer ${registered.token}`
    });
    expect(suspended.status).toBe(403);
    expect(suspended.body.error.code).toBe("FORBIDDEN");
    await expect(
      authService.login({
        email: registered.user.email,
        password: "StrongPassword123!"
      })
    ).rejects.toThrow("suspended");
  });
  it("should ignore client-supplied identity fields during profile sync", async () => {
    const res = await makeRequest(
      "POST",
      "/api/me/sync",
      { authorization: "Bearer dev-user" },
      {
        firebase_uid: "attacker-admin-uid",
        email: "attacker-admin@geoissue.org",
        display_name: "Updated Citizen"
      }
    );
    expect(res.status).toBe(200);
    expect(res.body.data.firebase_uid).toBe("citizen_demo_uid_456");
    expect(res.body.data.email).toBe("citizen@geoissue.org");
    expect(res.body.data.role).toBe("user");
    expect(res.body.data.display_name).toBe("Updated Citizen");
  });
  it("GET /api/admin/users with regular user token should return 403 FORBIDDEN", async () => {
    const res = await makeRequest("GET", "/api/admin/users", {
      authorization: "Bearer dev-user"
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
  it("GET /api/admin/users with admin token should return 200 OK", async () => {
    const res = await makeRequest("GET", "/api/admin/users", {
      authorization: "Bearer dev-admin"
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((user) => user.password_hash === void 0)).toBe(true);
  });
});
