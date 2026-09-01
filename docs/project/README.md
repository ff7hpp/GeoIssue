# GeoIssue project documentation

- [Project overview and setup](../../README.md)
- [Agent instructions](AGENTS.md)
- [Application architecture](ARCHITECTURE.md)
- [Full-stack readiness](FULL_STACK_READINESS.md)
- [Project study guide](PROJECT_STUDY_GUIDE.md)
- [Architecture diagrams](DIAGRAMS.md)
- [Cleanup history](../archive/CLEANUP_REPORT.md)

## Documentation layout

```text
docs/
├── project/       Active project docs
├── design/        Design specification
├── reference/     Diagrams and design exports
└── archive/       Historical documents and completed task logs
```

The application source remains in `client/` and `server/`. Their separation is required by their package manifests, build tools, imports, and deployment configuration.
