# GeoIssue Diagrams Pack

This folder converts the current `PROJECT_HANDOFF.md` into a concrete visual system-design package.

## File formats

Each diagram is provided as:
- `.svg` — best for documentation, zooming and presentations.
- `.png` — quick preview/share.
- `.mmd` — editable Mermaid source (GitHub can render Mermaid in Markdown).
- `.dot` — Graphviz source used to produce the SVG/PNG files.

## Diagrams

1. **01_System_Context** — Actors and external systems around GeoIssue.
2. **02_Container_Architecture** — React client, Express backend layers, auth, database, map/geocoding, storage.
3. **03_Infrastructure_Deployment** — Deployment topology and infrastructure boundaries.
4. **04_Use_Case_Diagram** — Visitor, User, Reviewer and Admin use cases.
5. **05_User_Report_Activity_Flow** — End-user report submission activity flow, including fallback/error branches.
6. **06_Data_Flow_DFD_Level_1** — How identity, reports, issue queries, support and reviewer actions move through the system.
7. **07_Report_Submission_Sequence** — Request-by-request sequence for creating a report and matching/creating an Issue.
8. **08_ERD_Database_Relationships** — Core entities, proposed fields and cardinalities.
9. **09_Issue_State_Machine** — Issue lifecycle from submitted through review to resolved/rejected.
10. **10_Report_Issue_Matching_Flow** — Proposed simple MVP matching logic.
11. **11_Role_Interaction_Flow** — End-to-end interaction between Citizen/User, GeoIssue, Reviewer and Admin.
12. **12_Implementation_Dependency_Plan** — Correct dependency order from requirements to deployment.

## Status legend

### VERIFIED FROM HANDOFF
The following are directly supported by the uploaded handoff:
- Report and Issue are separate concepts.
- Roles: Visitor, User, Reviewer, Admin.
- Core flow: map → report → validate identity/input → find nearby similar issue → attach or create → review → process → close.
- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.
- Auth: Firebase Authentication + Firebase Admin verification.
- Database: Neon PostgreSQL.
- Map: Leaflet + OpenStreetMap.
- Geocoding: Nominatim via backend.
- Core tables: users, issues, reports, issue_supporters, issue_status_history, audit_logs.
- Status values: submitted, in_review, accepted, in_progress, resolved, rejected.
- Server-side authorization and API/E2E tests are required.

### PROPOSED DESIGN DECISIONS
These are added to make the diagrams executable as a design, but were not fixed by the handoff:
- `categories` as a dedicated table, because Admin is expected to manage categories.
- Provider-neutral object/image storage for optional report images.
- Layered backend organization: routes → middleware → controllers → services → repositories.
- A simple MVP matching rule based on compatible category + nearby distance; **50 m is a proposal, not a confirmed business rule**.
- Reopen transitions from resolved/rejected back to review are shown as proposed/dashed.
- Frontend hosting, API hosting, storage, logging and monitoring providers remain TBD.

## Important decisions still requiring approval

1. Exact matching radius and how multiple candidates are resolved.
2. Whether a user may edit/delete a report after it enters review.
3. What public issue/report fields are visible to Visitors.
4. Exact image storage provider and upload limits.
5. Whether resolved/rejected Issues may be reopened.
6. Hosting providers for frontend and backend.
7. Rate-limit values, pagination defaults, retention and audit policies.

## Recommended folder location in the repository

`GeoIssue/GeoIssue_Diagrams/`

This keeps architectural diagrams separate from application code while remaining version-controlled.
