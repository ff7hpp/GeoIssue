# GeoIssue — MVP Master Prompt (Internship Cut)

> This is the trimmed, internship-realistic version of the full GeoIssue spec.
> Same domain model, same stack, same design direction — reduced roles, reduced
> test scope, i18n deferred to architecture-only, and two failure points from
> the original spec patched (first-login sync, distance formula).
> Use THIS document as the Source of Truth given to the coding agent.
> Keep the original full spec as a long-term reference doc only.

---

## 1. Project Identity

**Name:** GeoIssue
**Tagline:** Report. Track. Resolve.
**One-line description:** A civic-tech platform for reporting, grouping, tracking, and resolving location-based community issues.

---

## 2. Core Domain Model (do not simplify this away)

**Report ≠ Issue**

- A **Report** = one citizen submission.
- An **Issue** = the real-world problem. Many Reports can attach to one Issue.

If 100 people report the same pothole → 100 Reports, 1 Issue. This distinction must stay visible in the database, API, UI, and code naming end to end.

---

## 3. Roles (reduced from 4 to 3)

| Role | Can do |
|---|---|
| **Visitor** | View public Issues, explore map, view Issue details, register, sign in |
| **User** | Everything Visitor can + create Reports, view own Reports, support Issues, manage own account |
| **Admin** | Everything User can + change Issue status/priority, manage categories, view all Reports, manage users, view audit logs |

**Cut:** Reviewer is merged into Admin for MVP. Document it as a `DECISION REQUIRED` note in code/docs so splitting Reviewer out later is a config/permission change, not a rewrite — but do not build a separate role, separate dashboard, or separate permission branch for it now.

Authorization is always server-side. Never trust a client-submitted role.

---

## 4. Issue Lifecycle

Statuses: `submitted → in_review → accepted → in_progress → resolved`
Alternate: `in_review → rejected`

No arbitrary transitions — implement an explicit transition map. Every valid status change writes one `issue_status_history` row. Reopening resolved/rejected issues stays out of scope for MVP.

---

## 5. Report → Issue Matching (MVP algorithm)

Candidate = same category + Issue still active + distance ≤ threshold (default **50m**, configurable via `MATCH_RADIUS_METERS` env var).

**Failure point fixed:** compute distance with the **Haversine formula**, not flat Euclidean distance on lat/lng — Euclidean degrades badly as you move away from the equator and gives wrong "nearby" results even at city scale.

- Zero candidates → create new Issue.
- One clear candidate → attach Report to it.
- Multiple ambiguous candidates → attach to nearest; do not build an Admin "resolve ambiguity" UI for MVP.

No ML, no image recognition, no PostGIS.

---

## 6. Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript (modular monolith, not microservices)
- **DB:** Neon PostgreSQL, with migrations
- **Auth:** Firebase Authentication (email/password), Firebase Admin SDK on backend
- **Map:** Leaflet + OpenStreetMap, geocoding via Nominatim proxied through backend

### Failure point fixed — first-login sync
Firebase verifies identity but does **not** create a row in your `users` table. Without an explicit sync step, every authenticated request after first login will fail to resolve a local user/role.

Implement one of:
- `POST /api/me/sync` — called once by the frontend right after Firebase sign-in/sign-up, upserts a `users` row keyed on `firebase_uid`.
- Or: auth middleware auto-creates the local user row on first verified request if none exists (lazy upsert).

Pick one, document it, do not skip it — this is the single most common reason a "working" auth flow breaks in QA.

---

## 7. Core Database Entities

`users`, `categories`, `issues`, `reports`, `issue_supporters`, `issue_status_history`

**Cut for MVP:** drop `audit_logs` as a separate table. Log admin status/priority changes into `issue_status_history` (it already has `changed_by` + `note`) instead of building a second logging system. Revisit a real audit log only if the project scope grows post-internship.

Keep Report location and Issue location as separate lat/lng pairs (Report = where the citizen saw it, Issue = canonical location).

---

## 8. API Routes (MVP set)

```
GET    /api/health
GET    /api/issues
GET    /api/issues/:id
GET    /api/me
POST   /api/me/sync
GET    /api/me/reports
POST   /api/reports
PUT    /api/reports/:id
DELETE /api/reports/:id
POST   /api/issues/:id/support
DELETE /api/issues/:id/support
GET    /api/geocode?q=

GET    /api/admin/issues
PATCH  /api/admin/issues/:id/status
PATCH  /api/admin/issues/:id/priority
GET    /api/admin/users
```

Response shape:
```json
// success
{ "data": {}, "meta": {} }
// error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {} } }
```
Pagination on all list endpoints: `?page=1&limit=20`, capped max limit.

---

## 9. Frontend Pages (MVP set)

Public: `/`, `/issues`, `/issues/:id`, `/login`, `/register`
Authenticated: `/dashboard`, `/reports/new`, `/my-reports`, `/settings`
Admin: `/admin`, `/admin/issues`, `/admin/issues/:id`, `/admin/users`

**Cut:** no separate `/admin/audit-log` page (folded into Issue detail history).

---

## 10. Design Direction

Premium Minimal Civic UI — Apple / Linear / Vercel inspired. Monochrome base + one restrained accent color (exact hex = `DECISION REQUIRED`, pick one and lock it in week 1, don't leave it open past design phase).

Keep: light/dark mode via shared tokens, consistent spacing scale (4/8/12/16/24/32/48/64), restrained border radius (8–12px), minimal shadows, subtle 150–250ms hover/focus transitions.

**Cut for MVP:** don't hand-build the full component catalog from the original spec up front (Drawer, Tooltip, ConfirmationDialog, Skeleton, etc. as bespoke systems). Build only the components a screen actually needs, when it needs them. Use a shape-driven checklist, not a components inventory built speculatively.

---

## 11. Internationalization

**Architecture-ready, not implemented.** Structure strings/components so Arabic + RTL can be added later (no hardcoded English strings baked into layout logic, no LTR-only flex assumptions in core layout components) — but ship English-only UI for the internship deliverable. Do not build a live language switcher or translate all copy now.

---

## 12. Testing (trimmed — this is the biggest cut from the original spec)

**Cut:** full Playwright E2E suite, full integration test matrix.

**Keep, minimum viable:**
- Unit tests: matching logic (Haversine + threshold), status transition map, permission checks.
- One smoke-level API test per protected route confirming 401/403 actually fire for the wrong role (this is the test most demos skip and most reviewers ask about).
- One manual or scripted end-to-end walkthrough (not necessarily Playwright): register → login → create Report → see Issue on map → admin changes status → status reflects in UI. Doing this once manually and documenting the steps is acceptable for MVP; automate it only if time remains.

---

## 13. Security (unchanged — do not cut this)

- Firebase token verified server-side on every protected route.
- Ownership checks on Report edit/delete (user can only touch their own Reports).
- Input validation on all write endpoints.
- No secrets in frontend code.
- Sanitized error responses (no stack traces to client).

---

## 14. Delivery Phases (trimmed to match reduced scope)

```
Phase 1 — App shell + design tokens + responsive nav
Phase 2 — Map + Issue browsing (read-only)
Phase 3 — Firebase auth + /api/me/sync
Phase 4 — Backend foundation + Neon + migrations
Phase 5 — End-to-end Report creation (with Haversine matching)
Phase 6 — My Reports + Issue support
Phase 7 — Admin status/priority workflow
Phase 8 — Tests (unit + smoke) + accessibility pass + deploy
```
Every phase must leave the app in a working, demoable state.

---

## 15. Open Decisions — resolve before Phase 5, not later

These block real progress if left open past design phase:

- Image storage provider (Firebase Storage / Cloudinary / S3-compatible) — pick one, it affects env vars and the Report wizard flow directly.
- Hosting provider + domain.
- Accent color hex value.
- `MATCH_RADIUS_METERS` default (50m proposed).

Mark anything else genuinely undecided as `DECISION REQUIRED` with options + a recommendation — don't invent a silent choice.

---

## 16. Definition of Done (MVP)

A feature is done only when: UI works responsively in light+dark, API implemented with server-side validation and authorization, data persists correctly, errors/loading/empty states exist, types compile, lint passes, the relevant unit test (if applicable) passes.

Classify all reported progress as: **VERIFIED / IMPLEMENTED-NOT-VERIFIED / MISSING / BLOCKED / N/A** — never claim "done" on the strength of a 200 response alone.
