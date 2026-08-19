# Web requirements

## Goals

1. Search and read the whole archive — articles, repositories, social sources, AI archives.
2. Curate it: collections, tags, and manual correction of what a service got wrong.
3. Capture by URL and review what other clients queued.
4. Operate it: operations, schedules, storage, service health, and backup verification.
5. Administer access: sessions, devices, provider accounts, and revocation.

## Non-goals

Extraction, analysis, ranking, provider synchronization, backup execution, authorization decisions,
retention policy, multi-tenant administration, or any direct service, database, object-store, or
message-bus access.

## Requirements

- The client reaches only the public Edge API, over TLS, against an allowlisted endpoint.
- API types are generated from the pinned contract and a drift fails the build.
- Capability gating is server-driven; an absent capability is explained, never a dead control.
- Every view has loading, empty, partial, error, unauthorized, and offline states.
- Operations stream, fall back to polling visibly, and survive a reload.
- Provenance, extraction warnings, and restore verification are rendered truthfully.
- Destructive and external-write actions are named, confirmed, capability-checked, and idempotent.
- Sessions and devices are listable and individually revocable, server-side.
- Keyboard operability, visible focus, contrast, and reduced-motion hold in both themes.
- No user content reaches telemetry, diagnostics, or any third-party host.

First slice: sign in -> search -> open an article -> see its provenance and warnings.
