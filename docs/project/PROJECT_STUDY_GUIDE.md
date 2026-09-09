# GeoIssue Project Study Guide

Welcome to the GeoIssue project! This guide is a complete, step-by-step curriculum to help you understand the architecture, data flows, and code structure of GeoIssue from the ground up, based strictly on the active source code.

---

## 1. Project Purpose and Architecture

GeoIssue is a civic-tech web platform designed to report, group, and track municipal infrastructure problems (like potholes, broken streetlights, or water leaks).

**Core Architectural Principle: Report ≠ Issue**
- A **Report** is a single citizen's submission (e.g., "I saw a pothole here").
- An **Issue** is the canonical, real-world problem (e.g., "Pothole at 45 Main St").
When multiple citizens report the same problem within a 50-meter radius, the system uses the Haversine formula to cluster these Reports under a single canonical Issue. This elevates the priority without creating duplicate tickets for the municipality.

**Architecture:**
- **Frontend:** React 19 + Vite + JavaScript. Uses React Router for navigation and TanStack Query for server state management.
- **Backend:** Express 4 + JavaScript Modular Monolith. Follows a `Controller -> Service -> Repository` pattern.
- **Database:** PostgreSQL (Neon) with a strict schema and an in-memory fallback for local testing.

---

## 2. Simplified Folder Structure

```text
GeoIssue/
├── client/                      # React 19 + Vite + JavaScript Frontend
│   ├── src/
│   │   ├── app/                 # App root (App.jsx) & React Router (router.jsx)
│   │   ├── components/          # Reusable UI (LeafletMap, Badges)
│   │   ├── features/            # Domain pages (issues, reports, admin, auth)
│   │   ├── locales/             # i18n translations (ar, en, tr) & RTL handling
│   │   ├── services/            # api.js, auth.context.jsx, imageUpload.js
│   │   ├── styles/              # CSS tokens and globals
│
├── server/                      # Express + JavaScript Modular Monolith Backend
│   ├── src/
│   │   ├── config/              # env.js
│   │   ├── db/                  # pool.js (connection) and schema.sql
│   │   ├── middleware/          # auth.middleware.js, validate.middleware.js
│   │   ├── modules/             # Feature modules (issues, reports, auth, comments, etc.)
│   │   ├── shared/              # haversine.js, stateMachine.js, auth.utils.js
│   │   ├── tests/               # Vitest suite
│   │   ├── app.js               # Express application pipeline
│   │   └── server.js            # Server bootstrap
│
├── docs/                        # Reference documentation
├── docs/reference/diagrams/     # System architecture diagrams
├── AGENTS.md                    # Agent instructions (source of truth)
└── README.md                    # Project setup and overview
```

---

## 3. Step-by-Step Study Curriculum

Follow these steps in order. Do not skip steps, as each builds on the mental model of the previous one.

### Step 1: Environment & Config
* **Files to read:** `server/.env.example`, `server/src/config/env.js`, `client/.env.example`
* **What they do:** Define the environment variables needed to boot the server (port, JWT secret, database URL, and allowed client origins). `env.js` parses these and fails closed in production.
* **Connections:** `env.js` is imported by `server.js` and `pool.js` to configure connections.
* **Key functions/types:** `config` object.
* **Checkpoint:** You should understand that if `DATABASE_URL` is empty, the app still runs using in-memory mock data.

### Step 2: Database Schema & Connection
* **Files to read:** `server/src/db/schema.sql`, `server/src/db/pool.js`
* **What they do:** `schema.sql` defines the PostgreSQL tables (`users`, `categories`, `issues`, `reports`, `issue_status_history`, `issue_comments`, `issue_supporters`). `pool.js` initializes the `pg` connection or sets up the `mockStore` if no DB is provided.
* **Connections:** The `issues` table is the parent; `reports`, `comments`, and `issue_supporters` belong to an `issue_id`.
* **Key functions/types:** Look at the seed data in `schema.sql` and `initDb()` in `pool.js`.
* **Checkpoint:** You must understand the 1-to-many relationship between `issues` and `reports`, and how the fallback memory store works in `pool.js`.

### Step 3: Server Startup & Pipeline
* **Files to read:** `server/src/server.js`, `server/src/app.js`
* **What they do:** `server.js` is the entry point. It calls `initDb()` and `app.listen()`. `app.js` sets up the Express middleware pipeline (CORS, security headers, rate limits, JSON parsing) and mounts all modular routes (`/api/auth`, `/api/reports`, etc.).
* **Connections:** Links the network layer to the domain modules.
* **Key functions/types:** `bootstrap()` in `server.js`, `app.use()` mounts in `app.js`.
* **Checkpoint:** You should understand how an HTTP request enters the backend and gets routed to a specific feature module.

### Step 4: Frontend Startup, Router & State
* **Files to read:** `client/src/main.jsx`, `client/src/app/App.jsx`, `client/src/app/router.jsx`
* **What they do:** `main.jsx` mounts the React root and applies `i18next` translations. `App.jsx` wraps the app in TanStack Query (`QueryClientProvider`), Theme, and Auth contexts. `router.jsx` defines the page URLs mapping to components in `src/features/`.
* **Connections:** Connects the browser URL to the feature components.
* **Key functions/types:** `<App>`, `AppRouter`, `<Routes>`.
* **Checkpoint:** You should be able to trace a URL like `/issues/:id` to the `IssueDetail` component.

### Step 5: The API Layer (Frontend)
* **Files to read:** `client/src/services/api.js`
* **What they do:** The single source of truth for all HTTP requests from the frontend to the backend. It automatically injects the auth token into headers.
* **Connections:** Used by React Query `useQuery` and `useMutation` hooks across all features.
* **Key functions/types:** `request<T>()`, `api.createReport()`, `api.login()`.
* **Checkpoint:** Understand that frontend components *never* call `fetch` directly; they always use the `api` object.

### Step 6: Authentication Flow & Dev Tokens
* **Files to read:** `client/src/services/auth.context.jsx`, `server/src/middleware/auth.middleware.js`, `server/src/shared/auth.utils.js`
* **What they do:** `auth.context.jsx` manages the logged-in user and persisted JWT. `auth.middleware.js` verifies the JWT, reloads the active database user, and enforces roles. `auth.utils.js` hashes passwords with scrypt, upgrades legacy PBKDF2 hashes, and signs JWTs.
* **Connections:** Frontend `api.js` gets the token from `auth.context.jsx` and sends it to the backend.
* **Key functions/types:** `authenticate()`, `verifyToken()`, `useAuth()`.
* **Checkpoint:** Understand the fallback dev tokens: `dev-admin` (admin@geoissue.org), `dev-user` (citizen@geoissue.org), and `mock:*`.

### Step 7: Complete Auth Route → Controller → Service Flow
* **Files to read:** `server/src/modules/auth/auth.routes.js`, `auth.controller.js`, `auth.service.js`, `server/src/modules/users/users.repository.js`
* **What they do:** Traces exactly how a user registers or logs in. 
* **Connections:** Route `POST /login` -> `validateBody(loginSchema)` -> `authController.login` -> `authService.loginWithEmail` -> `usersRepository.findByEmail`. 
* **Key functions/types:** `hashPassword()`, `verifyPassword()`.
* **Checkpoint:** You should be able to trace the full lifecycle of an authentication request.

### Step 8: Authorization & RBAC (Role-Based Access Control)
* **Files to read:** `server/src/middleware/auth.middleware.js` (specifically `requireRole`)
* **What they do:** Enforces that only users with specific roles can hit certain endpoints. `UserRole` values are `'visitor' | 'user' | 'admin'`.
* **Connections:** Used heavily in `admin.routes.js`.
* **Key functions/types:** `requireRole('admin')`.
* **Checkpoint:** Understand that client-side hiding of UI elements is not enough; the server strict-checks roles via this middleware.

### Step 9: Maps & Geocoding
* **Files to read:** `client/src/components/map/LeafletMap.jsx`, `client/src/components/map/LocationPicker.jsx`, `server/src/modules/geocoding/geocode.service.js`
* **What they do:** The frontend uses React Leaflet to render interactive maps. When a user searches for an address, it calls `/api/geocode`. The backend acts as a proxy to Nominatim (OpenStreetMap), applying caching and custom User-Agents to prevent rate limits.
* **Connections:** `LocationPicker` calls `api.searchGeocode()` -> hits `geocode.routes.js` -> hits `geocode.service.js`.
* **Key functions/types:** `geocodeService.search()`.
* **Checkpoint:** You should understand why the frontend doesn't call Nominatim directly (to respect CORS and OSM rate limits).

### Step 10: Image Handling (Zero-Cost Optimization)
* **Files to read:** `client/src/services/imageUpload.js`
* **What they do:** Takes a user's uploaded photo and uses an HTML5 Canvas to aggressively compress it into a JPEG base64 string right in the browser (target max dimension: 1280px, quality: 0.82). 
* **Connections:** Imported and used in `ReportWizard.jsx`. The resulting string (~40-70KB) is saved directly in PostgreSQL text columns.
* **Key functions/types:** `compressImageToDataUrl()`.
* **Checkpoint:** Understand why there is no S3 or Firebase Storage bucket required for this project.

### Step 11: Reports & Haversine Matching (The Core Engine)
* **Files to read:** `client/src/features/reports/ReportWizard.jsx`, `server/src/modules/reports/reports.service.js`, `server/src/shared/haversine.js`
* **What they do:** The frontend guides the user to pick a location, category, and image. It calls `api.createReport()`. The backend `reports.service.js` queries the database for nearby active issues using the Haversine formula for precise GPS distance.
* **Connections:** If an active issue is within 50m (`config.matchRadiusMeters`), the new Report is attached to it, and `issue.report_count` increases. If not, a new canonical Issue is born.
* **Key functions/types:** `calculateDistance()`, `issuesRepository.findNearbyActiveCandidates()`.
* **Checkpoint:** You must understand the difference between `reports` table insertion and `issues` table insertion.

### Step 12: Report Ownership, Edit, and Delete
* **Files to read:** `server/src/modules/reports/reports.routes.js`, `reports.controller.js`
* **What they do:** Users can manage their own submissions. 
* **Connections:** `PUT /:id` hits `reportsController.update`, and `DELETE /:id` hits `reportsController.delete`. 
* **Checkpoint:** Understand that deleting a report does *not* necessarily delete the parent Issue, unless it was the only report attached to it.

### Step 13: Issues & Explore View
* **Files to read:** `client/src/features/issues/IssueExplore.jsx`, `server/src/modules/issues/issues.service.js`
* **What they do:** The frontend fetches a list of issues and plots them on the `LeafletMap`, alongside a sidebar list. The backend filters issues by status, category, and bounds.
* **Connections:** `IssueExplore` uses `useQuery` -> `api.getIssues()` -> `issues.service.js`.
* **Key functions/types:** `issuesService.getIssues()`.
* **Checkpoint:** Understand how pagination and filtering work on the public map.

### Step 14: Issue Detail, Support & Comments
* **Files to read:** `client/src/features/issues/IssueDetail.jsx`, `server/src/modules/comments/comments.routes.js`, `server/src/modules/comments/comments.service.js`, `server/src/modules/support/support.routes.js`
* **What they do:** The Detail page shows the canonical issue, its timeline, attached reports, and a comment thread. Users can click "Support" to upvote an issue.
* **Connections:** `POST /api/issues/:id/support` and `DELETE /api/issues/:id/support` hit `supportRouter` -> `supportController.addSupport` and `supportController.removeSupport`. Comments hit `commentsRepository.create()`. If an admin posts a comment, `is_official` is set to true. 
* **Key functions/types:** `addSupport()`, `removeSupport()`, `addComment()`.
* **Checkpoint:** Understand how the UI reacts immediately to successful Support and Unsupport mutations.

### Step 15: Admin Triage & The State Machine
* **Files to read:** `client/src/features/admin/AdminDashboard.jsx`, `server/src/shared/stateMachine.js`, `server/src/modules/admin/admin.routes.js`, `server/src/modules/admin/admin.controller.js`
* **What they do:** Admins can view a queue of issues and change their status (e.g., `submitted` -> `in_progress`) or priority (`low`, `medium`, `high`, `urgent`). 
* **Connections:** `PATCH /api/admin/issues/:id/status` hits `adminController.updateStatus`. `PATCH /api/admin/issues/:id/priority` hits `adminController.updatePriority`. The backend enforces that statuses can only change according to strictly defined legal transitions in `stateMachine.js`. Status changes insert an audit log into `issue_status_history`.
* **Key functions/types:** `isValidStatusTransition()`, `issuesService.updateIssueStatus()`, `issuesService.updateIssuePriority()`.
* **Checkpoint:** You must understand why an issue cannot go from `resolved` back to `submitted`.

### Step 16: Admin User Management
* **Files to read:** `server/src/modules/admin/admin.routes.js`
* **What they do:** Admins can list and manage user accounts (suspensions, role changes).
* **Connections:** `GET /users` hits `adminController.listUsers`. `PATCH /users/:id` hits `adminController.updateUser`.
* **Checkpoint:** Understand how `account_status = 'suspended'` affects `auth.middleware.js` logins.

### Step 17: Categories
* **Files to read:** `server/src/db/schema.sql` (Seed data at bottom), `server/src/modules/categories/categories.routes.js`
* **What they do:** Categories like "Road & Potholes" or "Street Lighting" are stored in the database. 
* **Connections:** Fetched globally on the frontend, but local mock arrays provide instant UI fallbacks before the network responds.
* **Checkpoint:** Understand how categories link Issues to standard municipal departments.

### Step 18: Tests & Backend Deployment
* **Files to read:** `server/src/tests/`, `client/e2e/`, `server/package.json`, `vercel.json`, `deploy/`
* **What they do:** Vitest covers haversine math, state machines, permissions, API security, and cryptography. Playwright covers browser flows. Vercel builds the static Vite frontend, while the API runs from the production Docker image.
* **Connections:** `npm run test` executes the suite.
* **Checkpoint:** Understand that any change to business logic (like distances or roles) requires verifying `npm --prefix server test` passes, and the frontend and backend deploy independently.
