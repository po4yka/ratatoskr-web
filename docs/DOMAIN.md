# Web domain model

## Terms

- **Session:** authenticated Platform session, its access token, and its refresh state.
- **Device:** a paired client, listed and individually revocable from this one.
- **Capability:** a server-declared feature of this deployment that the client renders from.
- **Archive record:** a document, repository, social source, or AI-archive item, with provenance.
- **Provenance:** acquisition path and authority of a record, rendered and never synthesized.
- **Collection:** user-curated grouping, owned by the server and edited through it.
- **Operation binding:** a Platform operation ID and its projected phase, warnings, and result.
- **Query key:** contract-derived cache identity, and the unit of invalidation.
- **View state:** loading, empty, partial, error, unauthorized, offline, or ready.

## Lifecycle

`unauthenticated -> booting -> ready -> (stale | refreshing) -> revoked | signed out`

A view: `idle -> loading -> ready | empty | partial | error | unauthorized | offline`

## Invariants

1. One network boundary: the public Edge API.
2. Generated types match the pinned contract, or the build fails.
3. Capability comes from the server and is never inferred from a failure.
4. Presentation is not enforcement.
5. Provenance, warnings, and verification results are rendered as given.
6. Every view distinguishes empty from failed.
7. Operation state is monotonic under duplicate and out-of-order events.
8. No user content leaves the client through telemetry or diagnostics.
