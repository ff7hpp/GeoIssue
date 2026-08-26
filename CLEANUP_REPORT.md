# GeoIssue — Cleanup Report

**Date:** 2026-08-26
**Scope:** Repository organization, documentation consolidation, and pre-existing bug fix
**Approach:** Verify before deleting. No source code behavior changed.

---

## 1. Files Moved

| Original Location | New Location | Reason |
|---|---|---|
| `GeoIssue_Design_Style_Spec.md` | `docs/design/DESIGN_SPEC.md` | Reference material; not an active config |
| `GeoIssue_MVP_Master_Prompt.md` | `docs/archive/MVP_SPEC.md` | Historical origin document |
| `PROJECT_HANDOFF.md` | `docs/archive/HANDOFF.md` | Historical handoff checklist |
| `tasks/plan.md` | `docs/archive/tasks/plan.md` | Completed task log |
| `tasks/todo.md` | `docs/archive/tasks/todo.md` | Completed checklist (all checked) |

---

## 2. Files Deleted

| File | Reason |
|---|---|
| `GeoIssue_Design_Style_Spec.md` (root) | Replaced by `docs/design/DESIGN_SPEC.md` |
| `GeoIssue_MVP_Master_Prompt.md` (root) | Replaced by `docs/archive/MVP_SPEC.md` |
| `PROJECT_HANDOFF.md` (root) | Replaced by `docs/archive/HANDOFF.md` |
| `tasks/plan.md` | Replaced by `docs/archive/tasks/plan.md` |
| `tasks/todo.md` | Replaced by `docs/archive/tasks/todo.md` |
| `tasks/` (directory) | Empty after moves |

All 5 files were copied and verified present in the new locations before originals were deleted.

---

## 3. Files Fixed

### `server/src/shared/auth.utils.ts`
- **Issue:** Referenced `config.adminUserId` which does not exist in `env.ts` — a pre-existing TypeScript error preventing a clean `tsc` build.
- **Fix:** Changed to `config.jwtSecret`.
- **Behavior:** Identical at runtime — same fallback string value, now in the correct config module.

### `server/src/config/env.ts`
- **Added:** `jwtSecret: process.env.JWT_SECRET || 'geoissue_super_secure_jwt_token_secret_key_2026'`

### `server/.env.example`
- **Added:** `JWT_SECRET=` with a descriptive comment.

---

## 4. Documentation Reorganized

### New `docs/` folder created

```text
docs/
├── README.md               Index and links to active docs
├── design/
│   └── DESIGN_SPEC.md      UI design system reference
└── archive/
    ├── MVP_SPEC.md         Original MVP spec (historical)
    ├── HANDOFF.md          Original handoff doc (historical)
    └── tasks/
        ├── plan.md         Completed plan
        └── todo.md         Completed task list
```

### `AGENTS.md` corrected

7 stale file paths replaced with actual current paths:

| Was (stale) | Now (actual) |
|---|---|
| `client/src/App.tsx` | `client/src/app/router.tsx` |
| `client/src/api.ts` | `client/src/services/api.ts` |
| `server/src/index.js` | `server/src/server.ts` |
| `server/src/routes/` | `server/src/modules/*/routes.ts` |
| `server/src/repositories/` | `server/src/modules/*/repository.ts` |
| `server/src/db.js` | `server/src/db/pool.ts` |
| `server/src/scripts/migrate.js` | `server/src/db/migrations.ts` |

Additional corrections: port 5000 -> 4000, ADMIN_USER_ID -> JWT_SECRET, added docs/ and diagrams to layout.

---

## 5. Intentionally Left Unchanged

- All `client/src/` and `server/src/` source files — no dead code found
- `DEFAULT_CATEGORIES` duplication between `IssueExplore.tsx` and `pool.ts` — intentional (client UI fallback vs server seed data)
- `GeoIssue_Diagrams/` — 12 architectural diagrams, useful reference
- `stitch_geoissue_reporting_system/` — design mockups, useful reference
- `README.md`, `FULL_STACK_READINESS.md`, `firebase.json`, `.firebaserc`, `.gitignore`

---

## 6. Final Build and Test Results

| Check | Result |
|---|---|
| `npm --prefix server test` | PASS: 6 test files, 28/28 tests |
| `npm --prefix server run build` | PASS: tsc clean, 0 errors (was 1 error before fix) |
| `npm --prefix client run build` | PASS: tsc + vite, 0 type errors, 1748 modules |
