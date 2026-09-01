# GeoIssue

> **Report. Track. Resolve.**
> Modern Civic-Tech Platform for Reporting, Grouping, and Resolving Community Problems.

Inspired by Apple, Linear, and Vercel design principles — built as a clean, modular full-stack application with strict **Report ≠ Issue** domain segregation, Haversine geographic deduplication, full multilingual support (**English**, **العربية** with RTL layout mirroring, and **Türkçe**), and Light/Dark/System theme parity.

---

## 1. Domain Architecture: Report ≠ Issue

- **Report**: An individual citizen submission containing exact observed coordinates, description, category, and optional photo.
- **Issue**: The canonical, unified real-world problem.

When multiple citizens report the same problem (e.g. 50 citizens reporting the same pothole within 50 meters), GeoIssue uses the **Haversine formula** to attach reports to the single canonical Issue, elevating its priority without creating duplicate tickets.

```
[Citizen 1: Report] ──┐
[Citizen 2: Report] ──┼──> [Haversine Match ≤ 50m] ──> [Single Canonical Issue]
[Citizen 3: Report] ──┘
```

### Issue Lifecycle:
```
[submitted] ──> [in_review] ──> [accepted] ──> [in_progress] ──> [resolved]
     │                                │
     └───> [rejected] <───────────────┘
```

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Routing**: React Router v7
- **Server State**: TanStack Query (React Query)
- **Maps**: Leaflet + React-Leaflet + OpenStreetMap
- **Internationalization**: i18next + react-i18next with dynamic RTL/LTR document direction
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design Tokens (Apple / Linear / Vercel minimal aesthetic)

### Backend
- **Framework**: Node.js + Express + TypeScript (Modular Monolith)
- **Database**: Neon PostgreSQL / pg Pool (with in-memory fallback store for offline testing)
- **Auth**: Firebase Authentication + Firebase Admin token verification + Local Demo User fallback
- **Geocoding**: Nominatim proxy with timeout resilience and graceful fallback
- **Validation**: Zod runtime schema validation
- **Testing**: Vitest (Haversine calculations, State machine transitions, Role permissions, Smoke tests)

---

## 3. Project Structure

```text
GeoIssue/
├── client/                      # React 18 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── app/                # App root & React Router setup
│   │   ├── components/         # Reusable UI (Header, Badges, Map, LocationPicker)
│   │   ├── features/           # Pages (Explore, IssueDetail, ReportWizard, MyReports, Admin)
│   │   ├── locales/            # i18n translations (ar, en, tr) & RTL handling
│   │   ├── services/           # API client, Auth Context, Theme Context
│   │   ├── styles/             # Design tokens, global styles, map CSS
│   │   └── types/              # Shared TypeScript definitions
│
├── server/                      # Express + TypeScript Modular Monolith Backend
│   ├── src/
│   │   ├── config/             # Environment & Firebase configuration
│   │   ├── db/                 # PostgreSQL pool, schema.sql, and migrations
│   │   ├── middleware/         # Auth, Zod validation, and error handling
│   │   ├── modules/            # Feature modules (issues, reports, admin, users, etc.)
│   │   ├── shared/             # Haversine formula, state machine, types, errors
│   │   ├── tests/              # Vitest test suite (unit + smoke)
│   │   ├── app.ts              # Express application setup & middleware pipeline
│   │   └── server.ts           # Server bootstrap & DB connection
│
├── docs/
│   ├── project/                 # Active project docs and architecture guide
│   ├── reference/               # Architecture diagrams and design exports
│   └── ...
└── README.md                     # Project setup and API overview
```

---

## 4. Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

### Running the Application

```bash
# Run both frontend & backend concurrently (from root):
npm run dev

# Or run separately:
# Terminal 1: Express API server (http://localhost:4000)
npm --prefix server run dev

# Terminal 2: Vite React client (http://localhost:5173)
npm --prefix client run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 5. Testing

Run the automated backend test suite:

```bash
npm --prefix server test
```

### Test Coverage:
- **`haversine.test.ts`**: Verifies exact distance computation, 50m threshold bounds, and spherical coordinates.
- **`stateMachine.test.ts`**: Verifies the strict lifecycle (`submitted -> in_review -> accepted -> in_progress -> resolved / rejected`).
- **`permissions.test.ts`**: Verifies server-side role enforcement (Visitor, User, Admin).
- **`api.smoke.test.ts`**: Verifies HTTP 401 unauthenticated and 403 forbidden security responses.

---

## 6. API Routes Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health and version |
| `GET` | `/api/categories` | Public | List active categories |
| `GET` | `/api/issues` | Public | Filterable issue list with pagination |
| `GET` | `/api/issues/:id` | Public | Issue details with report count & timeline |
| `POST` | `/api/issues/:id/support` | User | Upvote / support issue |
| `DELETE` | `/api/issues/:id/support` | User | Remove support |
| `GET` | `/api/me` | User | Current user profile |
| `POST` | `/api/me/sync` | User | First-login Firebase UID sync |
| `GET` | `/api/me/reports` | User | Authenticated citizen's reports |
| `POST` | `/api/reports` | User | Submit new report with Haversine matching |
| `PUT` | `/api/reports/:id` | Owner/Admin | Edit report description |
| `DELETE` | `/api/reports/:id` | Owner/Admin | Delete citizen report |
| `GET` | `/api/geocode?q=` | Public | Nominatim search proxy |
| `GET` | `/api/admin/issues` | Admin | Operational issue review queue |
| `PATCH` | `/api/admin/issues/:id/status` | Admin | Change issue lifecycle status + record note |
| `PATCH` | `/api/admin/issues/:id/priority` | Admin | Update issue priority |
| `GET` | `/api/admin/users` | Admin | List all user accounts |
| `PATCH` | `/api/admin/users/:id` | Admin | Update user role and status |
| `POST` | `/api/admin/categories` | Admin | Add new category |
| `PATCH` | `/api/admin/categories/:id` | Admin | Edit category / toggle active |

---

## 7. Architecture & System Diagrams

All detailed project documentation is indexed in [`docs/project/`](./docs/project/).

The detailed system design diagrams are located in [`docs/reference/diagrams/`](./docs/reference/diagrams/):
1. `01_System_Context`
2. `02_Container_Architecture`
3. `03_Infrastructure_Deployment`
4. `04_Use_Case_Diagram`
5. `05_User_Report_Activity_Flow`
6. `06_Data_Flow_DFD_Level_1`
7. `07_Report_Submission_Sequence`
8. `08_ERD_Database_Relationships`
9. `09_Issue_State_Machine`
10. `10_Report_Issue_Matching_Flow`
11. `11_Role_Interaction_Flow`
12. `12_Implementation_Dependency_Plan`
