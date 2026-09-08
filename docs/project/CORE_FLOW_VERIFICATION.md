# Current Core Flow

This document describes the code and local development flow as implemented. It does not claim production deployment readiness.

## Authentication

```mermaid
flowchart TD
  U[User] --> M[Auth modal]
  M --> F{Firebase email, Google, or native account?}
  F -->|Firebase| FT[Firebase ID token]
  F -->|Native| NJ[GeoIssue signed JWT]
  FT --> H[Authorization Bearer token]
  NJ --> H
  H --> A[Express authenticate middleware]
  A --> V{Valid Firebase token or valid JWT?}
  V -->|No| E[Safe user-facing error]
  V -->|Yes| DB[(Users table)]
  DB --> S[Authenticated user state]
  S --> P[Protected reports, support, profile, admin routes]
```

- Firebase ID tokens require `FIREBASE_PROJECT_ID` on the API. The client uses the Firebase web configuration.
- Native email/password accounts use a PBKDF2 password hash and a seven-day signed JWT.
- The token is stored in `localStorage`, refreshed from Firebase when applicable, sent as `Authorization: Bearer <token>`, and cleared with React Query data on logout.
- Auth state restores with `/api/auth/me`; the admin route waits for auth restoration before deciding access.

## Report, image, and issue flow

```mermaid
flowchart TD
  U[Authenticated citizen] --> L{GPS, map click, or place search}
  L --> R[Report wizard]
  R --> I{Optional JPEG PNG WebP evidence}
  I -->|Selected| C[Browser compression to JPEG data URL]
  I -->|Skipped| V[Server validation]
  C --> V
  V --> API[POST /api/reports]
  API --> D[(PostgreSQL reports)]
  API --> N{Same category issue within match radius?}
  N -->|Yes| X[Attach report and increment count]
  N -->|No| Y[Create canonical issue]
  X --> Q[GET /api/issues]
  Y --> Q
  Q --> E[Explore list and Leaflet markers]
  E --> DTL[Issue details with report image]
```

- GPS requests high accuracy, displays returned accuracy as a radius, and exposes permission-denied, unavailable, timeout, and unsupported-browser messages. Map click remains available.
- Image references are checked on both client and API. Supported data URLs must have a JPEG, PNG, or WebP signature; direct links must be HTTP(S).
- `Issue` is canonical. Multiple `Report` rows can support one issue.

## Data and map behavior

- `GET /api/issues` supplies both Explore cards and Leaflet markers. Explore retrieves all paginated issue pages, then Leaflet fits valid issue coordinates.
- Map/list toggling preserves filters and search. Leaflet resize handling updates hidden-to-visible maps and transition animation is disabled to avoid removed-map errors.
- `/api/health` reports `database: postgresql` or `database: memory`. Without a reachable `DATABASE_URL`, the API intentionally uses temporary memory data.

## Development database fixtures

1. Start PostgreSQL: `docker compose up -d postgres`.
2. Run schema/migration: `npm --prefix server run migrate`.
3. Load repeatable realistic fixtures: `npm --prefix server run seed:dev`.

`seed:dev` is blocked in production and requires `DATABASE_URL`. It creates 30 issues and reports across six existing categories, six statuses, coordinates around Istanbul, and three development residents. It is idempotent by fixture IDs and moves legacy out-of-city records to Istanbul.

## Verification record — 2026-09-05

| Area | Evidence | Result |
|---|---|---|
| Firebase/new native auth, refresh, logout, re-login | Browser flow and protected `/api/auth/me` | PASS |
| PostgreSQL data | health reported PostgreSQL; migration and `seed:dev` completed | PASS |
| Explore/map | 39 API issues and 39 Leaflet markers in browser | PASS |
| GPS | Simulated high-accuracy result, denied, unavailable, timeout, and manual selection | PASS |
| Image persistence | JPEG data URL submitted with HTTP 201, displayed after refresh, confirmed in PostgreSQL | PASS |
| Responsive layout | 128 checks across 16 widths and 8 screens; no overflow after fixes | PASS |
| Build/tests | server build; 36 Vitest tests; client build; 7 Playwright tests | PASS |

The later automated regression run fell back to memory data because the local Docker PostgreSQL container was stopped. That run still passed; use the three database commands above before a new PostgreSQL-backed session.
