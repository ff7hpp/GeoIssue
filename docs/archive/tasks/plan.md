# Implementation Plan: GeoIssue Simplification and Mobile Layout

## Objective

Make the frontend easier to learn and maintain without changing API contracts or report behavior. Improve the explore screen for narrow desktop/mobile widths and RTL layouts.

## Boundaries

- Keep the existing React/Vite, Express, Firebase, Neon, Leaflet, and i18n choices.
- Do not change database schema, API routes, authentication semantics, or report matching behavior in this pass.
- Do not remove diagrams or project documentation.
- Remove only confirmed dead code, generated artifacts, or duplicate presentation logic.

## Success Criteria

- `npm test` passes unchanged.
- `npm run build` passes.
- Explore screen has no horizontal clipping at 390px width in English or Arabic.
- Mobile users can switch between list and map views clearly.
- The largest explore-screen presentation code is split into named, easy-to-find components.
- Existing desktop layout and API data remain functional.

## Implementation Order

1. Extract reusable explore-screen UI pieces without changing behavior.
2. Replace brittle responsive styles with explicit mobile layout rules.
3. Verify desktop, English mobile, and Arabic mobile flows.
4. Remove only confirmed dead/generated files and document the resulting structure.

## Verification

- Server tests: `npm test`
- Full build: `npm run build`
- Browser checks at desktop and 390px mobile widths.
- API smoke checks for health, issues, and unauthenticated report rejection.
