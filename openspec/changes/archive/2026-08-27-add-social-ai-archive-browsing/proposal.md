## Why

The archive reader cannot yet expose the social posts and AI exports that the
services preserve, leaving provenance, import completeness, and local-backup
evidence inaccessible. This slice makes those records readable without
mistaking fixture data, authorization, or connectivity for live content or
preservation evidence.

## What Changes

- Add capability-gated social post list and detail routes for X, Instagram,
  and Threads, including supplied folder filters, acquisition provenance, and
  links to extracted Document IR only when the source supplies one.
- Add capability-gated ChatGPT and Claude archive list, import-status and
  completeness views; conversation readers; project grouping; and artifact
  version views.
- Render local-backup state only from explicit preservation evidence: verified
  evidence is locally backed up, while missing or reference-only evidence is
  not. Connection state never changes that conclusion.
- Add per-service connection management with supplied OAuth authorization
  redirects and explicit disconnect intent, while keeping provider tokens,
  callback handling, and revocation server-owned.
- Use contract-fixed fixtures and visibly label the integration pending because
  the pinned Edge contract exposes no social or AI-archive read, connection,
  or capability operations.

## Capabilities

### New Capabilities

- `social-ai-archive-browsing`: capability-gated social and AI archive
  projections, truthful provenance and preservation evidence, and fixture-only
  provider connection controls.

### Modified Capabilities

- None.

## Impact

- Affects the feature registry, lazy router, capability vocabulary,
  fixture-backed feature sources, social/AI/connection views, component tests,
  and implementation-plan status.
- Adds no dependency and does not alter the pinned generated API artifact.
  A future workspace/Edge contract change must define the live routes,
  capability names, OAuth facade, disconnect/revocation semantics, pagination,
  and projections before this client can replace the fixtures with API calls.
