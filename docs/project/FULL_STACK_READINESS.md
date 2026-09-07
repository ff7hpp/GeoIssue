# GeoIssue Full-Stack Readiness

## Scope and verdict

- Review date: 2026-09-07
- Verified target: local Windows/WSL2 internship demonstration
- Verdict: **READY for a local demonstration; NOT READY for public production**
- Runtime: React/Vite, Express, Docker PostgreSQL 16, Leaflet/OpenStreetMap, Nominatim, local JWT auth with optional Firebase

## Verified role model

| Action | Guest | User | Admin |
|---|---:|---:|---:|
| View accepted/in-progress/resolved issues | Yes | Yes | Yes |
| View submitted/in-review/rejected issues | No | Owner only | Yes |
| Create a report | No | Yes | Yes |
| Edit/delete a report | No | Owner only | Yes |
| Change issue status/priority/assignee | No | No | Yes |
| Manage users/categories | No | No | Yes |

Authorization is enforced by the API. Hiding a frontend control is not the security boundary.

## Current evidence

| Area | State | Evidence |
|---|---|---|
| Frontend/backend startup | VERIFIED | Vite client and Express API started locally; `/api/health` reported `database: postgresql` |
| Database | VERIFIED | Docker PostgreSQL on host port 15432; current health and direct SQL queries passed; no migration or seed was run during this verification |
| Persistent fixtures | VERIFIED | Pre/post checksums matched; exactly 30 fixture reports and 30 mapped issues remain; backup saved before QA writes |
| Public visibility | VERIFIED | Public API returned only `accepted`, `in_progress`, and `resolved`; 15/30 fixtures public; admin API returned 30/30 |
| Registration/login/logout/session | VERIFIED | Live local registration/login/logout passed; browser session survived reload; email auth remains usable when Firebase is unavailable |
| Authorization | VERIFIED | Guest admin access returned 401, user admin access returned 403, cross-user report edit returned 403, owner edit/delete passed |
| Lifecycle | VERIFIED | Live admin transitions `submitted -> in_review -> accepted` persisted; transition unit tests passed |
| Geolocation | VERIFIED with simulation | Browser Geolocation API coordinates and reported ±18 m accuracy rendered; strict coordinate validation and manual pin fallback are present |
| Physical-device location | NOT TESTED | Requires the user's device, location services, browser permission, and HTTPS when accessed by LAN IP |
| Map/database integration | VERIFIED | Browser loaded real API issue cards and Leaflet markers; no hardcoded issue marker data |
| Automated checks | VERIFIED | Server: 39/39 against isolated in-memory test storage; Chromium: 15/15; production build passed |
| Google sign-in | BLOCKED | Web configuration exists, but a real Google account flow, authorized origins, and Firebase Admin credential path were not available for verification |
| Dependency audit | PARTIAL | Client: 0 known vulnerabilities; server: 11 moderate, 0 high, 0 critical |

## Production blockers

- Configure and exercise a real Google account, authorized origins, and Firebase Admin credentials before claiming Google sign-in support.
- Replace local demo identity tokens with a production-safe demo/account policy; production already disables them.
- Add TLS, stable origin configuration, structured logs, monitoring, backup/restore, and rollback evidence.
- Resolve or accept the 11 moderate server dependency advisories after testing compatible Firebase/Google dependency upgrades.
- Split the client JavaScript bundle (about 756 kB minified, 208 kB gzip) if performance targets require it.
- Perform physical mobile GPS and permission-denied/unavailable/timeout checks; simulation cannot prove device hardware accuracy.

No critical or high-severity defect is known in the verified local demonstration path. This statement does not certify production readiness.
