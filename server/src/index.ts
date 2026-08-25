import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { requireAdmin, requireAuth } from "./auth.js";
import { canTransition, haversineMeters, Issue, Status, STATUSES, validateReport } from "./domain.js";
import { sql, store } from "./db.js";

const app = express(), port = Number(process.env.PORT || 5000), radius = Number(process.env.MATCH_RADIUS_METERS || 50);
const origins = new Set((process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((x) => x.trim()).filter(Boolean));
if (process.env.NODE_ENV !== "production") { origins.add("http://localhost:5173"); origins.add("http://127.0.0.1:5173"); }
app.use(helmet()); app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.has(origin)) })); app.use(express.json({ limit: "32kb" }));
const ok = (data: unknown, meta: Record<string, unknown> = {}) => ({ data, meta });
const fail = (res: express.Response, status: number, code: string, message: string, fields?: object) => res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });
const page = (req: express.Request) => ({ page: Math.max(1, Number(req.query.page) || 1), limit: Math.min(100, Math.max(1, Number(req.query.limit) || 20)) });
const id = (value: string) => /^[a-zA-Z0-9-]+$/.test(value) ? value : "";

app.get("/api/health", async (_req, res) => { let database = "memory"; try { if (sql) { await sql`SELECT 1`; database = "neon"; } } catch { database = "unavailable"; } res.json(ok({ service: "geoissue-api", database })); });
app.get("/api/issues", async (req, res) => { const { page: p, limit } = page(req), all = await store.issues(); res.json(ok(all.slice((p - 1) * limit, p * limit), { page: p, limit, total: all.length })); });
app.get("/api/issues/:id", async (req, res) => { const issue = await store.issue(id(String(req.params.id))); return issue ? res.json(ok(issue)) : fail(res, 404, "NOT_FOUND", "Issue not found."); });
app.get("/api/me", requireAuth, (req, res) => res.json(ok(req.user)));
app.post("/api/me/sync", requireAuth, (_req, res) => res.json(ok(_req.user)));
app.get("/api/me/reports", requireAuth, async (req, res) => { const { page: p, limit } = page(req), all = await store.reports(req.user!.uid); res.json(ok(all.slice((p - 1) * limit, p * limit), { page: p, limit, total: all.length })); });
app.post("/api/reports", requireAuth, async (req, res) => {
  const input = validateReport(req.body); if (!input) return fail(res, 400, "VALIDATION_ERROR", "Provide a valid title, description, category, and location.");
  const candidates = (await store.issues()).filter((x) => x.category === input.category && !["resolved", "rejected"].includes(x.status) && haversineMeters(input.latitude, input.longitude, x.latitude, x.longitude) <= radius).sort((a, b) => haversineMeters(input.latitude, input.longitude, a.latitude, a.longitude) - haversineMeters(input.latitude, input.longitude, b.latitude, b.longitude));
  const now = new Date().toISOString(), issue: Issue = { id: crypto.randomUUID(), ...input, status: "submitted", priority: "normal", reportCount: 0, createdAt: now, history: [{ status: "submitted", changedAt: now }] };
  const result = await store.createReport({ issue, existing: candidates[0], report: { id: crypto.randomUUID(), ...input, reporterId: req.user!.uid, createdAt: now } }); return res.status(201).json(ok(result));
});
app.put("/api/reports/:id", requireAuth, async (req, res) => { const input = validateReport(req.body); if (!input) return fail(res, 400, "VALIDATION_ERROR", "Provide a valid report."); const report = await store.updateReport(String(req.params.id), req.user!.uid, input); return report ? res.json(ok(report)) : fail(res, 404, "NOT_FOUND", "Your report was not found."); });
app.delete("/api/reports/:id", requireAuth, async (req, res) => { const report = await store.deleteReport(String(req.params.id), req.user!.uid); return report ? res.json(ok({ deleted: true })) : fail(res, 404, "NOT_FOUND", "Your report was not found."); });
app.post("/api/issues/:id/support", requireAuth, async (req, res) => res.status(201).json(ok(await store.support(id(String(req.params.id)), req.user!.uid, true))));
app.delete("/api/issues/:id/support", requireAuth, async (req, res) => res.json(ok(await store.support(id(String(req.params.id)), req.user!.uid, false))));
app.get("/api/geocode", async (req, res) => { const q = typeof req.query.q === "string" ? req.query.q.trim() : ""; if (!q) return fail(res, 400, "VALIDATION_ERROR", "Search text is required."); const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=tr&q=${encodeURIComponent(q)}`, { headers: { "User-Agent": "GeoIssue/1.0 civic-reporting-demo" } }); res.json(ok(await response.json())); });
app.get("/api/admin/issues", requireAuth, requireAdmin, async (req, res) => { const { page: p, limit } = page(req), all = await store.issues(); res.json(ok(all.slice((p - 1) * limit, p * limit), { page: p, limit, total: all.length })); });
app.patch("/api/admin/issues/:id/status", requireAuth, requireAdmin, async (req, res) => { const issue = await store.issue(id(String(req.params.id))), next = req.body?.status as Status; if (!issue) return fail(res, 404, "NOT_FOUND", "Issue not found."); if (!STATUSES.includes(next) || !canTransition(issue.status, next)) return fail(res, 409, "INVALID_TRANSITION", `Cannot change ${issue.status} to ${next}.`); return res.json(ok(await store.updateStatus(issue.id, next, req.user!.uid, req.body.note))); });
app.patch("/api/admin/issues/:id/priority", requireAuth, requireAdmin, async (req, res) => { if (!['low', 'normal', 'high'].includes(req.body?.priority)) return fail(res, 400, "VALIDATION_ERROR", "Priority must be low, normal, or high."); return res.json(ok(await store.setPriority(id(String(req.params.id)), req.body.priority))); });
app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => res.json(ok(await store.users())));
app.use((_req, res) => fail(res, 404, "NOT_FOUND", "Route not found."));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(error instanceof Error ? error.message : "Unexpected error"); fail(res, 500, "INTERNAL_ERROR", "Unexpected server error."); });
app.listen(port, () => console.log(`GeoIssue API listening on http://localhost:${port}`));
