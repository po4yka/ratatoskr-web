## 1. Error normalization

- [ ] 1.1 Add failing tests in `src/api/gateway/errors.test.ts`: status-to-kind matrix (400 invalid, 403 forbidden, 404 not-found, 401 unauthenticated, 501 unsupported, other 4xx terminal), envelope field attachment (code, message, retryable, field_violations, correlation_id, trace_id) from contract-typed fixtures, unparseable/absent body classification without invented fields. Verify they fail for the missing-module reason.
- [ ] 1.2 Implement `src/api/gateway/errors.ts` (discriminated union + normalizer + envelope parsing) and verify the tests pass.

## 2. Retry policy

- [ ] 2.1 Add failing tests in `src/api/gateway/retry.test.ts`: only-when-idempotent matrix — GET/HEAD/OPTIONS retried on network error, 5xx, retryable 429 within bound; POST/PUT/DELETE never retried; explicit `retryable: false` envelope suppresses retry; bound respected exactly; injectable timing observed. Verify red.
- [ ] 2.2 Implement `src/api/gateway/retry.ts` (safe-method predicate + transient classifier + bounded attempt loop inputs) and verify green.

## 3. Refresh coordination

- [ ] 3.1 Add failing tests in `src/api/gateway/refresh.test.ts`: ten concurrent waiters cause exactly one refresh I/O call; all resolve after success; replayed 401 in same epoch does not re-refresh; rejected credential revokes all waiters and fires the session-clear hook once; network-loss refresh rejects offline with session intact; no refresher configured classifies 401 as unauthenticated directly. Verify red.
- [ ] 3.2 Implement `src/api/gateway/refresh.ts` (epoch counter, single in-flight promise, waiter queue, truthful outcome classification) and verify green.

## 4. Gateway client

- [ ] 4.1 Add failing tests in `src/api/gateway/client.test.ts`: base URL join; bearer attach from token source; no header when no token; JSON body serialization; empty-body response resolves undefined; end-to-end single-flight 401 → refresh → replay through the client; caller abort reaches fetch on attempt and replay, rejects untouched, no retry follows; error responses normalize through the union. Verify red.
- [ ] 4.2 Implement `src/api/gateway/client.ts` (`createGateway` wiring fetch, envelopes, retry, refresh, aborts) and verify green.

## 5. Query keys

- [ ] 5.1 Add failing tests in `src/api/gateway/query-keys.test.ts`: repeated construction deep-equal; query-parameter insertion order irrelevant; distinct path parameters produce distinct keys; path parameter expands to final segment; named factories pinned to generated contract paths at type level. Verify red.
- [ ] 5.2 Implement `src/api/gateway/query-keys.ts` and verify green.

## 6. Gate

- [ ] 6.1 Run the full local gate in order — `api:check`, `typecheck`, `lint`, `format:check`, `test`, `build`, `audit:ui -- --fail-under 69`, `npm audit --omit=dev --audit-level=high` — and confirm every step exits zero.
