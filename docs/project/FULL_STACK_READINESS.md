# GeoIssue Full-Stack Readiness

## Scope and verdict

- Review date: 2026-09-09
- Branch: `A`
- Local verdict: **VERIFIED for PostgreSQL-backed testing**
- Cloud verdict: **BLOCKED pending cost approval and deployment credentials/session**
- Runtime: React/Vite, Express, PostgreSQL 16, Leaflet/OpenStreetMap, Nominatim, email/password + JWT

## Permission model

| Action | Guest | User | Admin |
|---|---:|---:|---:|
| View accepted/in-progress/resolved issues | Yes | Yes | Yes |
| View submitted/in-review/rejected issues | No | Owner only | Yes |
| Create a report | No | Yes | Yes |
| Edit/delete a report | No | Owner only | Yes |
| Change issue status/priority/assignee | No | No | Yes |
| Manage users/categories | No | No | Yes |

Authorization is enforced by the API. Frontend visibility is not the security boundary.

## Evidence

| Area | State | Evidence |
|---|---|---|
| Build | VERIFIED | Server syntax check and Vite production build passed |
| Automated backend tests | VERIFIED | 48/48 Vitest tests passed against PostgreSQL |
| Database | VERIFIED | `/api/health` reported `database: postgresql` |
| Migration safety | VERIFIED | User/report/issue counts matched before and after `firebase_uid -> auth_uid` rename |
| Backup/restore | VERIFIED | Fresh dump restored into an isolated PostgreSQL 16 container; counts matched |
| Registration/login/logout/session | VERIFIED | Real browser registration, reload restoration, logout, and re-login passed |
| Password storage | VERIFIED | New scrypt hashes and legacy PBKDF2 upgrade test passed; plaintext is not stored |
| User persistence | VERIFIED | Browser-created user logged in through a second API process |
| Report persistence | VERIFIED | Browser-created report appeared in My Reports after logout/login and through a second API process |
| Backend authorization | VERIFIED | Missing token 401, regular user admin access 403, admin endpoint tests passed |
| Geolocation implementation | VERIFIED with simulation | High-accuracy request, accuracy radius, errors, and manual pin fallback are covered |
| Physical-device GPS | NOT VERIFIED | Requires the target phone/laptop, permission, location services, and deployed HTTPS |
| Public cloud URLs | BLOCKED | No cloud resource was started or created before cost approval |
| Dependencies | PARTIAL | Client 0 advisories; server 5 moderate advisories; no forced upgrade applied |

## Remaining limitations

- JWT is stored in `localStorage`; this is acceptable for the short test environment but raises impact if an XSS defect exists.
- Existing legacy users without password hashes remain preserved but cannot use password login until an administrator securely assigns a password.
- Cloud Run/managed database cold starts can delay the first request.
- Physical GPS accuracy depends on the device and environment; the application cannot guarantee a specific accuracy.
- The Vite bundle still emits a chunk-size warning.

See [CLOUD_TESTING.md](CLOUD_TESTING.md) for the cost gate, deployment plan, rollback, and shutdown checklist.
