## Context

The tree has generated contract types (`src/api/generated/schema.ts`) and nothing that calls the API. The pinned contract exposes eight paths, mints sessions once via `POST /v1/sessions/telegram` (credential returned once, digest stored server-side), and defines **no refresh endpoint**. `ErrorEnvelope` carries stable fields — `code`, `message`, `retryable`, optional `field_violations`, `correlation_id`, `trace_id` — and states retryability is explicit and consumer-branchable. No token-storage ADR exists yet; `AGENTS.md` forbids choosing storage in passing. ESLint enforces 200 code lines per file, 120 per function, complexity 8, 2 parameters on hand-written code.

## Goals / Non-Goals

**Goals:**

- One gateway module every future call site uses; no view ever touches `fetch`.
- Single-flight refresh coordination with queued replay, owned here once.
- Failure normalization the views can branch on by discriminant alone.
- Query keys a future cache client can consume without reshaping.
- Every behaviour proven by a unit test against injected doubles; zero network in the suite.

**Non-Goals:**

- Choosing token or refresh-token storage (awaits the approved storage ADR).
- Streaming (operation events) — separate concern, later plan item.
- Idempotency-key generation for capture submit — belongs to the capture feature (plan item 8); the gateway accepts caller headers today.
- Adding TanStack Query or any dependency.

## Decisions

### The refresh I/O is injected; only the coordination is built here

The legacy reference describes silent refresh over an httpOnly cookie endpoint. This contract version has none — inventing one would be a hand-written contract violation. So the gateway takes a `refresher` callback plus a `tokenSource` and owns the mechanism: epoch counter, single in-flight promise, waiter queue, replay-once, truthful classification of the refresh outcome (invalid credential → revoke + clear hook; network loss → offline, session intact). Session boot (item 4) supplies the strategy — re-exchange an assertion, or a contract addition through a workspace changeset. Alternative considered: build the gateway around a hard-coded `/v1/auth/refresh` call. Rejected: it would ship a call the pinned contract does not define and fail the first real request against Platform.

### Errors are one discriminated union, classified by status, decorated by envelope

Nine kinds exactly as `docs/ARCHITECTURE.md` section 4.2 lists. Status decides the kind (400→invalid, 401→unauthenticated, 403→forbidden, 404→not-found, 501→unsupported, other 4xx→terminal); 5xx and network failures stay transient inside the retry policy and surface as terminal once the bound is exhausted, carrying the server's explicit `retryable` flag so views can offer a manual retry without guessing. Envelope fields attach when present and are never invented when absent — including for unparseable bodies. `partial` exists as a kind because the architecture requires it, but HTTP cannot produce it here: partial success lives in `OperationSnapshot.status === "partially_succeeded"` with its own `errors`/`warnings`, which features construct from. Alternative considered: branch on envelope `code`. Rejected: the code vocabulary is service-owned and open-ended; status is the stable classifier this client actually receives.

### Retry: safe methods only, bounded, server-flag-respected

GET/HEAD/OPTIONS auto-retry on transport-level transients (network error, any 5xx, 429 with a retryable envelope), at most `attempts` times with injectable timing. An envelope whose `retryable` is false suppresses retry even on a safe method. Mutating methods never auto-retry — capture submit is made replay-safe by its required `Idempotency-Key`, but that protects a user-driven retry, not a hidden transport loop. Alternative considered: treat keyed POSTs as retryable. Rejected: "idempotent requests only" is the stated rule, and the key's semantics are per-feature decisions this module should not make early.

### Query keys are plain typed utilities derived from path templates

`queryKey(template, { path?, query? })` splits a contract path template into segments, substitutes path parameters, appends sorted query entries — insertion order can never leak into the key. Thin named factories (`capabilities()`, `operation(id)`, `operationEvents(id)`, `operationsRoot()` for prefix invalidation) cover today's readable endpoints; new endpoints add factories in their feature slice. Type-level exhaustiveness pins factory paths to `keyof typeof import(schema).paths`. TanStack Query arrives with session boot or capability discovery and consumes these tuples unchanged.

### Abort signals pass through untouched

The caller's signal reaches `fetch` on every attempt including replays. Cancellation rejects with the caller's abort reason — not normalized, not retried. A cancelled request is a cancelled request, not an API failure; collapsing them would misrender offline states.

### Module shape fits the size ratchet

`src/api/gateway/` splits into `errors.ts` (union + normalizer + envelope parsing), `refresh.ts` (coordinator), `retry.ts` (policy predicates), `client.ts` (createGateway wiring), `query-keys.ts`. All I/O seams (`fetchImpl`, `sleep`, `tokenSource`, `refresher`, `onSessionRevoked`) are constructor options with production defaults; tests inject doubles. Functions take a single options object where more than one parameter would be natural, keeping max-params honest.

## Risks / Trade-offs

- [Injected refresher lets item 4 forget to wire one] → Without a refresher configured, 401 classifies straight to unauthenticated instead of hanging or throwing; the gap is visible at the first unauthorized response, and session boot lands next in the plan.
- [Status-based classification can lag a code the platform later introduces] → Codes are carried verbatim on every error, so views can refine branching later without another normalization change.
- [No integration test against a real Platform] → Deliberate: the gate forbids live backends. Contract fixtures are typed against the generated `ErrorEnvelope`, so a contract drift fails compilation of the fixtures themselves; workspace end-to-end coverage arrives with the Compose profile.
- [Replay-once could surprise long-poll style reads] → Reads here are ordinary request/response; operation streaming will use the events endpoint, not this replay path.

## Migration Plan

Nothing consumes the gateway yet, so there is nothing to migrate or roll back. The module ships behind imports no file makes until item 4.

## Open Questions

None. The deferred decisions (storage ADR, refresh strategy, query client dependency) are named above and belong to later plan items by design.
