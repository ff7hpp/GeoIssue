# GeoIssue architecture README

This folder contains the complete technical documentation. The public root
`README.md` stays intentionally short; use these pages when studying or
maintaining the project.

- [Project overview and setup](../../README.md)
- [Agent instructions](AGENTS.md)
- [Application architecture](ARCHITECTURE.md)
- [Full-stack readiness](FULL_STACK_READINESS.md)
- [Temporary cloud testing plan](CLOUD_TESTING.md)
- [Project study guide](PROJECT_STUDY_GUIDE.md)
- [Architecture diagrams](DIAGRAMS.md)
- [Current core flow and verification](CORE_FLOW_VERIFICATION.md)
- [Cleanup history](../archive/CLEANUP_REPORT.md)

## Where to study each subject

- React, routing, maps, and UI: [ARCHITECTURE.md](ARCHITECTURE.md)
- Node.js, Express, API layers, and middleware: [ARCHITECTURE.md](ARCHITECTURE.md)
- PostgreSQL schema, migrations, and seed data: [PROJECT_STUDY_GUIDE.md](PROJECT_STUDY_GUIDE.md)
- Authentication and role permissions: [PROJECT_STUDY_GUIDE.md](PROJECT_STUDY_GUIDE.md)
- Docker, WSL, local setup, and deployment: [FULL_STACK_READINESS.md](FULL_STACK_READINESS.md)
- Verified end-to-end flow: [CORE_FLOW_VERIFICATION.md](CORE_FLOW_VERIFICATION.md)

## Documentation layout

```text
docs/
├── project/       Active project docs
├── design/        Design specification
├── reference/     Diagrams and design exports
└── archive/       Historical documents and completed task logs
```

The application source remains in `client/` and `server/`. Their separation is required by their package manifests, build tools, imports, and deployment configuration.
