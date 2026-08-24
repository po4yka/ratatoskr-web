## Why

The client has no way to talk to Platform. Every future view would otherwise grow its own fetch call, its own token handling, and its own idea of what an error is, which is exactly the scatter `docs/ARCHITECTURE.md` section 4 exists to prevent. One gateway that owns access-token attach, single-flight refresh, bounded idempotent retry, normalized errors, contract-shaped query keys, and abort propagation is plan item 3 in `docs/IMPLEMENTATION_PLAN.md`, and it is the prerequisite for session boot (item 4) and every feature after it.

## What Changes

- Add a gateway module under `src/api/gateway/` over `fetch`: base URL configuration, JSON envelope handling, and access-token attachment through an injected token source.
- Add silent refresh coordination: a 401 suspends the queue, triggers exactly one in-flight refresh, replays every waiter once with the new token, and resolves to a truthful terminal state when refresh fails. The refresh I/O itself is injected; this contract version mints sessions once (`POST /v1/sessions/telegram`) and defines no refresh endpoint, so the mechanism lives here and the strategy arrives with session boot.
- Add a bounded transport retry policy that retries safe methods only (GET, HEAD, OPTIONS), honours the server's explicit `retryable` signal from the `ErrorEnvelope` contract, and never auto-retries a mutating request.
- Normalize every failure into one discriminated union — offline, unauthenticated, revoked, forbidden, unsupported, not-found, invalid, partial, terminal — carrying the envelope's stable fields (`code`, `message`, `retryable`, `field_violations`, `correlation_id`, `trace_id`) when the server supplied them.
- Add contract-shaped query-key factories derived from API paths plus parameters, so cache invalidation keys stay aligned with generated paths as features arrive.
- Propagate caller abort signals through every request path, including replayed requests.

Out of scope: session boot UI and the protected shell (item 4), components, streaming (operation events), idempotency-key generation for capture submit (belongs with the capture feature), any new dependency — TanStack Query is not added here; the key factories are plain typed utilities ready for it.

## Capabilities

### New Capabilities

- `api-gateway`: The client reaches Platform through one typed fetch gateway that attaches the access token, coordinates single-flight refresh on 401 with queued replay, retries only bounded idempotent requests, normalizes every failure into a discriminated error union aligned with the platform `ErrorEnvelope` contract, derives cache keys from API paths and parameters, and propagates abort signals everywhere.

### Modified Capabilities

None. This change adds the repository's second local capability alongside `api-type-generation`.

## Impact

- New code: `src/api/gateway/` (errors, refresh coordinator, retry policy, client, query keys) with unit tests beside each module. No existing file changes.
- Consumers: none yet — nothing calls the gateway until session boot (item 4).
- Dependencies: none added. Tests run against injected fetch doubles; no live backend, no network in the suite.
- Gate: unchanged command list; new modules must hold the size limits in `eslint.config.js` (200 code lines per file, 120 per function, complexity 8, 2 params).
