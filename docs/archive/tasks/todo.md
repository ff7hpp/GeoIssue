# Tasks: GeoIssue Simplification and Mobile Layout

- [x] Extract the explore filters and issue card/list presentation.
  - Acceptance: the explore page remains behaviorally identical on desktop.
  - Verify: build and browser desktop check.

- [x] Fix mobile and RTL layout for the explore screen.
  - Acceptance: no horizontal clipping at 390px; list/map toggle is usable.
  - Verify: browser checks in English and Arabic.

- [x] Add small structure documentation for learning.
  - Acceptance: important frontend directories explain their responsibility.
  - Verify: inspect the tree and build.

- [x] Run regression verification and remove only confirmed generated/dead artifacts.
  - Acceptance: tests and build pass; no API route changes.
  - Verify: `npm test`, `npm run build`, API smoke checks.
