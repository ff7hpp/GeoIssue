# GeoIssue Full-Stack Readiness

## Scope

- Product: civic issue reporting web application
- Current environment: local React/Vite client, Express API, local demo identity middleware, Neon PostgreSQL, Leaflet/OpenStreetMap and Nominatim
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
| Frontend/UX | VERIFIED for core desktop and report-form mobile flows | Registration, map exploration, issue details, report form, Arabic RTL at 390px and mobile logout were exercised in a real browser | Add settings, broader accessibility checks and more physical-device coverage |
| APIs/backend | VERIFIED for current CRUD | Authenticated CRUD, invalid input, 401/403, body limits and geocoding exercised | Add API versioning, public/private DTOs, pagination, detail, assignment, admin and settings endpoints |
| Database/storage | VERIFIED for local MVP | PostgreSQL 16 runs healthy in Docker, migrations created seven tables, two reports persisted across backend restart | Add and test backup/restore and migration recovery before production |
| Authentication | VERIFIED for local demo; production Firebase MISSING | Demo citizen/admin sessions and invalid/expired/suspended token paths are exercised; Firebase Web config exists | Configure Firebase Admin credentials and exercise a real Firebase ID token before production |
| Authorization | VERIFIED for current server policies | Server tests and live API checks prove user/admin separation and a regular user receives 403 on admin routes | Add broader cross-user browser coverage |
| Security/privacy | VERIFIED for public issue DTO; remaining controls MISSING | Public list/detail responses omit internal user IDs, assignment IDs, deletion fields and assignee email; 33 tests pass | Add edge rate limits plus privacy and retention policies |
| Tests/quality gates | VERIFIED for current automated scope | Six Vitest files pass 33 tests; three Playwright tests pass locally and in GitHub Actions for map load, demo sign-in/report entry and Arabic RTL mobile layout | Expand Playwright through final report submission |
| Hosting/deployment/cloud | BLOCKED | Google Cloud project exists, but Billing is disabled and the user declined paid activation | Select a no-cost hosting option or explicitly enable Billing before provisioning |
| Version control/CI/CD | VERIFIED | GitHub Actions run `33902397303` passed server tests/build/audit, client build/audit and Playwright | Add deployment only after a no-cost hosting decision |
| Performance/cache/CDN/load balancing | IMPLEMENTED, NOT VERIFIED for production | Client build is about 203 KB gzip and warns about a chunk above 500 KB; geocode uses in-memory caching | Split the client bundle and add production metrics; CDN/load balancing are N/A at current MVP scale |
| Reliability/backups/recovery | MISSING | Health endpoint and local persistence are verified | Add backup/restore test and production fail-closed database configuration |
| Observability/error tracking | MISSING | Console output only | Add request IDs, structured logs, RED metrics, error tracking, alerts and runbooks |
| Languages/geography | MISSING as a coherent product rule | UI is Arabic; geocoding is restricted to Turkey and prefers Turkish/English | Decide target country and supported languages, then add real i18n |
| Privacy/operations/docs | MISSING | README covers local setup | Add privacy/terms, data deletion/export, deployment, rollback, restore, key rotation and incident documentation |

## P0 release blockers

- [x] Define visitor, reporter, operator/admin and super-admin roles.
- [x] Enforce RBAC and issue state transitions on the server.
- [x] Sanitize public issue responses and remove personal identifiers.
- [x] Replace unrestricted permanent user deletion with approved cancel/archive rules and audit history.
- [x] Build separate user and administrator journeys.
- [x] Require and test email verification or explicitly accept the risk.
- [ ] Add automated authorization, API, database and critical browser-flow tests.
- [ ] Establish staging/production deployment, secrets, migrations, monitoring, backup/restore and rollback.

### Risk Acceptances
- **Email Verification**: For the MVP launch, the risk of unverified user emails is explicitly accepted. We are prioritizing low friction for civic reporting over verified identity. Malicious mass-reporting is mitigated by the 50m spatial clustering limit and basic IP rate limiting (to be added at the edge), rather than strict email proofing.

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
