## Context

See `proposal.md` for motivation. The client already has one generated Edge gateway, session boot,
capability context, a lazy authenticated route registry, and a semantic shell. Platform commit
`3b6efb1942d0ebc7735faa8ceb04338a54b535db` adds the anonymous status and owner-admin paths. The fleet
spec `web-platform-operational-integration` defines the cross-repository acceptance boundary.

## Goals / Non-Goals

**Goals:**

- Keep public status outside authentication while reusing the same network/error normalization
  boundary.
- Make each owner view independently capability-driven and bounded by server cursors.
- Establish one focus-management boundary and executable browser accessibility evidence.
- Prove the production build against both a bounded mock and the workspace Compose profile.

**Non-Goals:**

- Browser-side authorization, direct service/database access, mutation of schedules or audit data,
  diagnostics export, or operation-payload display.
- LLM cost accounting, agent/chat/digest/RSS/signals surfaces, localization infrastructure, or a
  command palette; their fleet owners and contracts are undecided.

## Decisions

### Put `/status` in a separate top-level route branch

The router will mount a lazy standalone status page before the authenticated wildcard. This makes
absence of session boot structural and testable. Reusing the protected shell and conditionally
suppressing redirects was rejected because it could still mount auth and capability providers.

### Extend the generated gateway with small feature sources

Status and each admin feature get a source that names only generated paths and response types while
the shared gateway retains credentials, refresh, retry, and error normalization. Hand-written wire
interfaces and casts were rejected because they hide contract drift.

### Use three navigation entries and one shared operational page frame

Operations, schedules, and audit declare their exact capability independently. They share layout and
request-state presentation but not response models. A single `platform.owner` client flag was
rejected because it duplicates server authorization and cannot express partial deployment support.

### Keep pagination in the URL

Cursor values live in route search parameters and every page request remains bounded. Client-side
collection filtering was rejected because archive-scale data is unbounded and a refreshed first page
must not silently replace a historical cursor.

### Manage focus once at the router boundary

A route-focus component observes location changes, focuses the destination `h1`, and leaves focus
untouched for data refreshes. Page-specific effects were rejected because they would diverge and
steal focus on every query transition.

### Use Chromium Playwright plus axe as development-only evidence

The bounded mock server will expose deterministic anonymous/member/owner states and record requests.
Browser coverage runs both themes and 320/1280 widths; the workspace profile later points the same
browser assertions at real public HTTP. Multi-browser coverage is deferred because the first
acceptance requires one reliable composed smoke, not a compatibility matrix.

## Risks / Trade-offs

- [The mock can drift from Platform] → Pin generated OpenAPI first and require the final Compose
  smoke against exact remote SHAs.
- [Focus placement can become noisy] → Trigger only on location changes initiated by navigation and
  never on query/data state changes.
- [Dense operational tables can overflow] → Use semantic tables at wide widths and labeled stacked
  rows at narrow widths, then measure both with browser checks.
- [Automated axe cannot prove screen-reader usability] → Record manual screen-reader work as
  unverified unless it is actually performed.
- [Adding Playwright increases developer install cost] → Keep both packages dev-only, Chromium-only,
  bounded, and confirm the production bundle contains neither.

## Migration Plan

1. Publish the generated contract pin before behavior commits.
2. Publish development-only browser dependencies separately.
3. Publish feature and evidence changes after the full Web gate.
4. Run the workspace Compose profile against the exact Web SHA before deleting the task worktree.
5. Roll back Web first by returning `main` to the prior client commit; Platform's additive routes can
   remain deployed without affecting older clients.
