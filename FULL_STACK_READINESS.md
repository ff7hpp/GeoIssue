# GeoIssue Full-Stack Readiness

## Scope

- Product: civic issue reporting web application
- Current environment: local React/Vite client, Express API, Firebase Authentication, Neon PostgreSQL, Leaflet/OpenStreetMap and Nominatim
- Review date: 2026-08-21
- Release verdict: **NOT READY for public production; suitable as a technical MVP/demo**

## Evidence legend

- **VERIFIED:** exercised successfully with current evidence
- **IMPLEMENTED, NOT VERIFIED:** present but not fully exercised in the target environment
- **MISSING:** required but absent
- **N/A:** not applicable, with reason
- **BLOCKED:** verification requires a missing permission, environment, credential, or decision

## Current roles and permissions

| Action | Visitor | Authenticated user | Operator/Admin | Super Admin |
|---|---:|---:|---:|---:|
| View issues in UI | No | All issues | Role does not exist | Role does not exist |
| Read issue API | Yes, including fields that should be private | Yes | — | — |
| Create issue | No | Yes | — | — |
| Edit own issue | No | Yes, regardless of status | — | — |
| Delete own issue | No | Yes, permanent deletion | — | — |
| Change own issue status | No | Yes | — | — |
| Modify another user's issue | No | No; server returns 403 | No elevated role exists | No elevated role exists |
| Open the management dashboard | No | Yes, every user | No separate view | No separate view |

## Layer readiness

| Layer | State | Current evidence | Required next action |
|---|---|---|---|
| Product requirements | MISSING | Core reporting concept exists, but roles, lifecycle, visibility, deletion, geography and launch criteria are not specified | Approve PRD, role matrix, status transitions and release criteria |
| Frontend/UX | VERIFIED for core desktop flow; partial mobile | Registration, map search, create/edit/status/delete, dashboard and insights exercised in a real browser | Add user/admin separation, settings, details/timeline, mobile logout, accessibility and device checks |
| APIs/backend | VERIFIED for current CRUD | Authenticated CRUD, invalid input, 401/403, body limits and geocoding exercised | Add API versioning, public/private DTOs, pagination, detail, assignment, admin and settings endpoints |
| Database/storage | VERIFIED for current single table | Neon connection, migration and persistent CRUD verified | Add profiles, roles, history, assignments, attachments, notifications, audit logs and migration recovery |
| Authentication | VERIFIED for basic email/password | Registration, login state, Firebase token verification and logout work | Add email verification, password reset, account lifecycle and admin MFA policy |
| Authorization | MISSING | Ownership is enforced, but there is no RBAC; owners can change status and delete permanently | Add trusted roles/claims and server-enforced state/role policies |
| Security/privacy | PARTIAL | Helmet, CORS allowlist, parameterized SQL, validation, safe errors and secret exclusion exist | Remove reporter/UID from public output, add rate limits, audit trail, privacy and retention rules |
| Tests/quality gates | MISSING | Manual and temporary automated verification only; no committed suite | Add unit, API integration, migration, authorization and Playwright E2E tests |
| Hosting/deployment/cloud | MISSING | Firebase and Neon services are configured; application runs locally | Select hosting, staging/production environments, HTTPS/domain, secret manager and rollback |
| Version control/CI/CD | MISSING | Git and lockfiles exist | Add CI for install, lint, tests, build, audit and migration verification |
| Performance/cache/CDN/load balancing | IMPLEMENTED, NOT VERIFIED for production | Client build is about 146 KB gzip; geocode uses in-memory caching | Add production metrics and bounded cache; CDN/load balancing are N/A until traffic/availability requires them |
| Reliability/backups/recovery | MISSING | Health endpoint confirms Neon connection | Add external-call timeouts, degraded states, backup/restore test and production fail-closed database configuration |
| Observability/error tracking | MISSING | Console output only | Add request IDs, structured logs, RED metrics, error tracking, alerts and runbooks |
| Languages/geography | MISSING as a coherent product rule | UI is Arabic; geocoding is restricted to Turkey and prefers Turkish/English | Decide target country and supported languages, then add real i18n |
| Privacy/operations/docs | MISSING | README covers local setup | Add privacy/terms, data deletion/export, deployment, rollback, restore, key rotation and incident documentation |

## P0 release blockers

- [ ] Define visitor, reporter, operator/admin and super-admin roles.
- [ ] Enforce RBAC and issue state transitions on the server.
- [ ] Sanitize public issue responses and remove personal identifiers.
- [ ] Replace unrestricted permanent user deletion with approved cancel/archive rules and audit history.
- [ ] Build separate user and administrator journeys.
- [ ] Require and test email verification or explicitly accept the risk.
- [ ] Add automated authorization, API, database and critical browser-flow tests.
- [ ] Establish staging/production deployment, secrets, migrations, monitoring, backup/restore and rollback.

## P1 product completeness

- [ ] Profile and settings: language, theme, notifications, privacy and account lifecycle.
- [ ] Issue detail, status timeline, assignment, priority, attachments and notifications.
- [ ] Paginated/filterable API and documented contracts.
- [ ] Real localization for approved languages and geography.
- [ ] Accessibility and performance acceptance checks.

## Release exit criteria

- [ ] Every applicable layer is VERIFIED or has a documented and accepted risk.
- [ ] No P0 item remains open.
- [ ] Cross-user, admin, invalid-input, dependency-failure and recovery tests pass in staging.
- [ ] Public responses contain no unapproved personal data.
- [ ] Deployment, migration, backup/restore, monitoring and rollback evidence exists.
- [ ] No temporary credentials or test records remain.
