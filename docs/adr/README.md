# Web ADRs

Use `NNNN-short-title.md` with context, options, decision, consequences, security and privacy
impact, accessibility impact, contract and compatibility impact, validation, and follow-up.

Accepted:

- [ADR-0001](0001-framework-and-build.md): React, TypeScript, Vite.
- [ADR-0002](0002-shadcn-base-ui.md): shadcn/ui on the Base UI base.
- [ADR-0003](0003-icons.md): lucide for icons, itshover where motion earns its place.
- [ADR-0004](0004-design-libraries.md): four design libraries, connected on different terms.
  Includes the licence decision: vendoring MIT + Commons Clause source is conditional on
  Ratatoskr not being sold.
- [ADR-0005](0005-api-type-generation.md): API type generation from the pinned contract and
  drift enforcement.
- [ADR-0006](0006-credential-custody.md): credential custody in sessionStorage, with the
  refresh-cookie landing as the revisit trigger.

Backlog:
- ADR-0007: Server-state cache, query keys, and invalidation.
- ADR-0008: Capability discovery and gating.
- ADR-0009: Operation streaming transport and polling recovery.
- ADR-0010: Sanitization and rendering of untrusted archive content.
- ADR-0011: Accessibility baseline and how it is verified.
- ADR-0012: Dependency budget and Content Security Policy.
