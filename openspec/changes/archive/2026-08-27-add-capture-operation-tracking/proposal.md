## Why

Web can submit a capture but does not yet provide the truthful, recoverable
operation experience that follows it. Users need to see the accepted work
advance, recover when the live channel drops, and return to the resulting
analysis without confusing a partial result for a complete one.

## What Changes

- Add a capability-gated URL-capture route that validates a URL locally and
  submits the generated `SubmitCapture` request with a stable idempotency key.
- Add an operation tracker that consumes the public SSE progression feed,
  preserves a monotonic snapshot, visibly recovers to polling after a stream
  failure, and routes a completed result to its analysis.
- Add retry and partial-success surfaces that use only the operation snapshot's
  error, warning, retryability, and result data.
- Refresh the pinned Platform OpenAPI document and generated client types so
  the existing paginated operation-list endpoint can power a minimal recent
  captures list.
- Add local read and favorite presentation state for listed capture results,
  consistent with the existing fixture-backed reader state.
- Record paste-text capture as a follow-up: the pinned contract accepts only a
  URL, so this change will not invent a browser request shape.

## Capabilities

### New Capabilities

- `capture-operation-tracking`: capability-gated URL submission, durable
  operation observation, recovery, retry, and recent-capture presentation.

### Modified Capabilities

- `archive-search-reader`: expose a completed capture result through the
  existing reader route with local read and favorite presentation state.

## Impact

- Affects the generated Platform API pin, gateway query keys, lazy route tree,
  navigation, capture/operation feature modules, and component tests.
- Consumes existing Platform `POST /v1/captures`, operation snapshot/SSE
  endpoints, and paginated `GET /v1/operations`; no new Platform endpoint is
  introduced.
- No dependency is added. Paste-text, duplicate pre-check, a separate
  link-only save, and server-persisted archive-preference mutations remain
  contract follow-ups.
