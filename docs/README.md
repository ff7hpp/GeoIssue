# GeoIssue — Documentation Index

This folder contains reference and archived documentation for the GeoIssue project.

## Structure

```text
docs/
├── design/
│   └── DESIGN_SPEC.md        UI design system: color tokens, typography, spacing, motion
│
└── archive/
    ├── MVP_SPEC.md            Original MVP master prompt (historical reference)
    ├── HANDOFF.md             Original project handoff document (historical reference)
    └── tasks/
        ├── plan.md            Completed implementation plan (simplification & mobile layout)
        └── todo.md            Completed task checklist (all items verified ✓)
```

## Active Documentation

Active documentation is kept at the repository root, not here:

| File | Purpose |
|---|---|
| [`README.md`](../README.md) | Setup, commands, and API reference |
| [`AGENTS.md`](../AGENTS.md) | Agent source of truth — read this before changing code |
| [`FULL_STACK_READINESS.md`](../FULL_STACK_READINESS.md) | Release readiness, P0 blockers, layer assessment |

## Design Reference

[`docs/design/DESIGN_SPEC.md`](design/DESIGN_SPEC.md) contains the concrete design-system rules used in the current UI:
- Color palette (light/dark themes, accent color)
- Typography scale and font stack
- Spacing scale (4/8/12/16/24/32/48/64 only)
- Radius, shadows, and motion rules

Pass this document to any agent that touches UI components.
