# GeoIssue — Report. Track. Resolve.

GeoIssue is a compact, professional civic-tech MVP for reporting, grouping, tracking, and resolving location-based community issues. The code intentionally keeps the architecture small: one frontend screen, one API entrypoint, one domain module, and one migration.

## Current Features

- Report ≠ Issue: reports are citizen submissions; nearby reports are grouped into one real-world Issue.
- Haversine matching with a configurable `MATCH_RADIUS_METERS` (default 50m).
- Explicit `submitted → in_review → accepted → in_progress → resolved` lifecycle with rejection branch.
- Local demo identity headers, server-side role checks, and admin routes; production auth can be added later without changing the report/issue model.
- Leaflet/OpenStreetMap map, Nominatim proxy, responsive light/dark UI, and consistent response envelopes.
- Neon PostgreSQL migration for users, categories, issues, reports, supporters, and status history.
- Memory fallback for local study/demo use when `DATABASE_URL` is absent.

Without `DATABASE_URL`, the API uses temporary in-memory demo data. With Neon configured, reports are stored permanently in PostgreSQL.

## Minimal project structure

```text
geoissue/
|-- client/src/App.tsx       UI, auth, map, report form, issue list
|-- client/src/api.ts        typed API client
|-- client/src/styles.css    design tokens and responsive styles
`-- server/src/index.ts      API routes and response envelope
   server/src/domain.ts      model, matching, validation, permissions
   server/src/db.ts          Neon + memory storage boundary
   server/src/migrate.ts     database schema
```

## Local identity

This study-friendly MVP intentionally has no external authentication provider. The client uses `demo-resident` and sends it as `x-user-id`; set `ADMIN_USER_ID=demo-admin` to exercise admin routes with that identity.

## Run Locally

Start the API:

```bash
cd server
npm install
npm run dev
```

Start the client in a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000`.

The **Use exact location** button requires browser location permission. It works on localhost during development and requires HTTPS after deployment. A phone with GPS normally gives a more accurate result than a desktop computer. If permission or GPS is unavailable, the interface offers an approximate city location based on the user's IP; click the map afterward to mark the exact issue position.

## API routes

- `GET /api/health` - API and database connection status
- `GET /api/issues`, `GET /api/issues/:id`, `GET /api/geocode?q=Ankara` - public
- `GET /api/me`, `POST /api/me/sync`, `GET /api/me/reports` - authenticated
- `POST /api/reports`, support routes - authenticated
- `GET /api/admin/issues`, `PATCH /api/admin/issues/:id/status`, `PATCH /api/admin/issues/:id/priority`, `GET /api/admin/users` - admin

All success responses are `{ data, meta }`; errors are `{ error: { code, message, fields? } }`. List endpoints accept `page` and `limit`.

## Decisions

- Design: Work Sans, dark navy `#04162f`, tonal gray surfaces, muted green for resolved/map states, warm yellow for active work, 4px geometry, and no shadows.
- Matching: 50m default, overridden by `MATCH_RADIUS_METERS`.
- Images: deferred because no attachment flow is in scope.
- Hosting: Vercel frontend + Node-compatible backend + Neon recommended; domain remains deployment-specific.
- Reviewer: intentionally merged into Admin for MVP. Splitting it later is a role/permission configuration change, not a domain rewrite.

## Verification

```bash
cd client && npm run typecheck && npm run lint && npm run build
cd ../server && npm run typecheck && npm test
```

Status: frontend checks **VERIFIED**; domain unit tests **VERIFIED**; local demo API **VERIFIED**; Neon flow **IMPLEMENTED-NOT-VERIFIED** until a database is supplied. The memory fallback is intentionally not a production data store.

## Neon PostgreSQL Setup

1. Create a Neon project and open its **Connect** dialog.
2. Enable connection pooling and copy the PostgreSQL connection string.
3. Put the private value in `server/.env`:

```env
DATABASE_URL=postgresql://user:password@your-endpoint-pooler.neon.tech/database?sslmode=require
```

4. Create the tables and indexes:

```bash
cd server
npm run db:migrate
```

5. Restart the API and open `http://localhost:5000/api/health`. It should report `"mode": "neon"` and `"connected": true`.

Never place the Neon connection string in frontend code or commit `server/.env` to Git.
