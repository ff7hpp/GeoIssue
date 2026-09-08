# GeoIssue Agent Instructions

These instructions are the project source of truth for AI agents and future development sessions. Read this file before changing code.

## Project identity

- Product: ANKAGEO GeoIssue, a civic issue-reporting web application.
- Repository root: `GeoIssue/`.
- The active source of truth is this repository. `D:\Download\PROJECTS\Obsidian\geoissue` contains a related reference/archive copy and must not be edited as the implementation unless the user explicitly asks for synchronization.
- Current status: technical MVP/demo. The project is not production-ready; `FULL_STACK_READINESS.md` is the authoritative readiness and release-blocker list.
- The UI is Arabic-first and right-to-left in its current implementation. Preserve Arabic labels and RTL behavior unless localization is explicitly being designed.
- The primary geography is Turkey. Place search uses Nominatim with `countrycodes=tr` and Turkish/English results.

## Repository layout

```text
client/                                   React 19 + Vite + JavaScript frontend
client/src/app/router.jsx                 React Router route definitions
client/src/components/                    Shared UI components (map, badges, layout)
client/src/features/                      Page-level feature modules (issues, reports, admin, auth)
client/src/locales/                       i18n translation files (ar, en, tr) and i18n config
client/src/services/api.js               Frontend API client (all fetch calls to the backend)
client/src/services/auth.context.jsx     Hybrid Firebase + JWT auth state provider
client/src/services/firebase.js          Firebase SDK initialization (Auth only, free tier)
client/src/services/imageUpload.js       Client-side canvas image compression (no paid storage)
client/src/styles/                        CSS design tokens and component styles

server/                                   Express 4 + JavaScript modular monolith backend
server/src/app.js                         Express application setup and route registration
server/src/server.js                      Server bootstrap and database initialization
server/src/config/env.js                 Environment variable validation
server/src/config/firebase.js            Firebase Admin SDK initialization
server/src/db/pool.js                     PostgreSQL pool and in-memory fallback store
server/src/db/schema.sql                 Database schema (tables, indexes, constraints)
server/src/db/migrations.js             Migration runner script
server/src/middleware/auth.middleware.js  Authentication (Firebase + JWT + dev mock) and RBAC
server/src/middleware/validate.middleware.js  Zod request body validation
server/src/middleware/error.middleware.js    Global error handler
server/src/modules/                       Feature modules (auth, issues, reports, comments, etc.)
server/src/modules/*/routes.js            Express routes and handlers for compact modules
server/src/modules/*/controller.js        Request handlers for larger modules
server/src/modules/*/service.js           Business logic per module
server/src/modules/*/repository.js        Database access per module
server/src/shared/haversine.js           Haversine distance formula (50m clustering)
server/src/shared/stateMachine.js        Issue lifecycle state machine and valid transitions
server/src/shared/auth.utils.js          Password hashing and JWT utilities
server/src/shared/errors.js             Typed AppError factory
server/src/tests/                         Vitest test suite (unit + smoke)

docs/                                     Documentation and reference material
docs/design/DESIGN_SPEC.md              UI design tokens, color system, typography guide
docs/archive/MVP_SPEC.md                Original MVP master prompt (historical)
docs/archive/HANDOFF.md                 Original project handoff document (historical)
docs/archive/tasks/                      Completed task logs (historical)
docs/project/                             Centralized project documentation
docs/reference/diagrams/                  12 system architecture diagrams (SVG, PNG, MMD, DOT)
docs/reference/design-exports/            Design mockups and exports (reference only)

README.md                                 Setup, commands, and API documentation
```

## Local setup and commands

Use Node.js and npm. Install and run each package independently; the root `package-lock.json` is only a minimal placeholder and has no application dependencies.

Frontend:

```bash
cd client
npm install
npm run dev       # Vite, normally http://localhost:5173
npm run build
npm run lint
npm run preview
```

Backend, in a second terminal:

```bash
cd server
npm install
npm run dev       # nodemon, normally http://localhost:4000
npm start
npm run db:migrate  # requires a working DATABASE_URL
```

Before running the app on a new laptop:

1. Copy `server/.env.example` to `server/.env` and set `PORT`, `CLIENT_ORIGIN`, `JWT_SECRET`, and optionally `DATABASE_URL`.
2. The MVP uses a local demo identity via the `x-user-id` header; no external auth provider is required.
4. If `DATABASE_URL` is set, run `npm run db:migrate` from `server`; without it, the API intentionally falls back to temporary in-memory demo data.

## Runtime behavior and contracts

- `GET /api/health` reports API/database status.
- `GET /api/issues` is public read access.
- `POST /api/reports` requires the local `x-user-id` identity header.
- `PUT /api/issues/:id`, `PATCH /api/issues/:id/status`, and `DELETE /api/issues/:id` require auth and currently allow only the issue owner.
- Valid categories are `Road`, `Water`, `Electricity`, `Traffic`, `Environment`, and `Other`.
- Valid statuses are `Pending`, `In Progress`, and `Resolved`.
- Issue coordinates must be valid latitude/longitude values; issue titles are limited to 160 characters and descriptions to 3000 characters.
- Public issue responses currently include `reporter` and `createdBy`; treat this as a known privacy risk and do not expand public personal-data exposure.
- The server resolves the local demo identity and role; replace this middleware with production auth later if needed.
- Neon PostgreSQL is optional. The repository layer must continue to support the memory fallback for demos unless the user explicitly removes it.
- Geocoding is proxied through the server, cached in memory, and rate-limited to respect Nominatim usage. Preserve a descriptive User-Agent and do not add client-side direct Nominatim calls.

## Engineering rules

- Keep changes small, focused, and consistent with the existing plain JavaScript/JSX architecture. Do not introduce JavaScript, a new state library, or a new framework without an explicit request.
- Reuse the existing `issueApi`, repository layer, route validation, auth middleware, and CSS tokens before adding parallel abstractions.
- Validate and authorize on the server even when the client already validates. Never trust client-supplied ownership, status, reporter, or user identity.
- Use parameterized Neon queries/tagged template queries. Do not build SQL with string interpolation from request data.
- Preserve the API response shapes and status/category values unless the change includes updating all consumers and documentation.
- Keep secrets in environment variables. Do not print tokens, service-account contents, database URLs, or user personal data in logs.
- Maintain CORS restrictions, Helmet, JSON body limits, coordinate bounds, and input length limits when modifying the server.
- Keep map interactions accessible: labeled controls, keyboard-usable buttons, clear error messages, and visible focus states.
- Preserve responsive behavior and both light/dark themes. Prefer existing CSS custom properties over one-off colors.
- Update `README.md` when setup, environment variables, commands, or API routes change. Update `docs/project/FULL_STACK_READINESS.md` only when there is evidence for a readiness-state change.

## Verification expectations

For frontend changes, run:

```bash
cd client
npm run lint
npm run build
```

For backend changes, run at least:

```bash
cd server
npm start
```

Then check `GET /api/health` and exercise the affected route with the appropriate auth/database configuration. For changes to auth, ownership, validation, deletion, status transitions, database queries, or public responses, verify both success and failure paths, including unauthenticated and cross-user attempts.

There is currently no committed automated test suite. Do not claim a feature is fully verified based only on a successful build; record manual/environment limitations clearly.

## Priority direction

When the user asks what to work on next, prioritize the P0 blockers in `docs/project/FULL_STACK_READINESS.md`: server-enforced RBAC and state transitions, privacy-safe public DTOs, non-destructive deletion/audit history, separate user/admin journeys, email verification policy, automated authorization/API/database/browser tests, and deployment/secrets/monitoring/backup/rollback evidence.

## Git and handoff

- Inspect `git status` before editing and preserve unrelated user changes.
- Do not reset, checkout, or delete user work without explicit permission.
- After changes, report the files changed, checks run, and any environment-dependent checks that could not be run.
- Keep commits focused if the user asks for commits; use a clear message describing the change.
