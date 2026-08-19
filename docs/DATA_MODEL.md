# Web client data model

## Held state

- session: access token per the approved storage ADR, expiry, refresh state, and signed-in identity.
- capability set: what this deployment declares it can do, refreshed on boot and on reconnect.
- server-state cache: responses keyed by contract-derived query keys, with explicit invalidation
  tied to the operation that changed the data.
- operation bindings: operation ID, monotonic phase, warnings, and result projection.
- user preferences that are genuinely local: theme, density, and last-used view.
- in-flight form drafts, bounded and discarded on success.

## Not held

Provider tokens. Extracted document bodies beyond the cache. Credentials of any connected account.
Any authoritative copy of a record — the server owns every record, and the client owns none.

## Constraints

Cache entries expire and are invalidated by operation completion, not by a timer alone. A stale entry
rendered as live is a defect. Collections are unbounded on the server and paginated or virtualized in
the client; nothing fetches a whole collection to filter it locally. Sign-out and device revocation
clear all local session state and cached archive content. No user content is persisted outside the
cache, and no user content is written to diagnostics.
