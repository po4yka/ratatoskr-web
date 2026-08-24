## Purpose

One module stands between every view and the Platform Edge API: it attaches the access token, refreshes silently when Platform answers 401, retries only what is safe to retry, turns every failure into one typed error the view can branch on, derives cache keys from API paths, and passes caller cancellation through untouched.

## ADDED Requirements

### Requirement: Requests are issued against the configured Edge API

The gateway SHALL send every request to the configured base URL joined with the request path, serialize a JSON request body, and parse a JSON response body. A response with no body SHALL resolve to undefined rather than a failed parse.

#### Scenario: Request reaches the configured origin with the given path

- **WHEN** the gateway is created with base URL `https://edge.example` and asked to GET `/v1/capabilities`
- **THEN** the underlying fetch receives `https://edge.example/v1/capabilities`

#### Scenario: A body-less successful response resolves to undefined

- **WHEN** Platform answers 200 with an empty body
- **THEN** the gateway resolves to undefined instead of throwing a parse error

### Requirement: The access token is attached to outgoing requests

The gateway SHALL read the current access token from the injected token source before sending and attach it as the bearer credential on the Authorization header. When the source holds no token, the request SHALL be sent without an Authorization header rather than with an empty credential.

#### Scenario: Token from the source rides on the request

- **WHEN** the token source returns a token and a request is issued
- **THEN** the underlying fetch receives an Authorization header bearing that token

#### Scenario: No token sends no Authorization header

- **WHEN** the token source holds no token and a request is issued
- **THEN** the underlying fetch receives no Authorization header

### Requirement: Concurrent 401 responses trigger exactly one refresh

When a request is answered 401, the gateway SHALL attempt one credential refresh. Concurrent requests answered 401 while that refresh is in flight SHALL share it: the refresh I/O runs exactly once, and every waiter replays its original request once against the fresh credential.

#### Scenario: Ten concurrent 401s cause one refresh and ten replays

- **WHEN** ten simultaneous requests are each answered 401 once, the refresh succeeds, and each replay succeeds
- **THEN** the refresh I/O was invoked exactly once and all ten requests resolve to their replayed responses

#### Scenario: A replayed 401 does not re-enter refresh in the same epoch

- **WHEN** a request replayed after a successful refresh is answered 401 again
- **THEN** the gateway surfaces an unauthenticated error without starting a second refresh for that epoch

### Requirement: Refresh failure resolves to a truthful terminal state

When the injected refresh fails because the credential is no longer valid, the gateway SHALL reject every waiter with a revoked error and invoke the injected session-clearing hook exactly once. When the refresh fails because the network is unavailable, waiters SHALL be rejected with an offline error and the session state SHALL be left intact.

#### Scenario: Invalid credential on refresh revokes the session

- **WHEN** a 401 triggers a refresh and the refresh I/O reports the credential rejected
- **THEN** all waiters reject with a revoked error and the session-clearing hook ran once

#### Scenario: Network loss during refresh stays offline

- **WHEN** a 401 triggers a refresh and the refresh I/O fails with a network error
- **THEN** all waiters reject with an offline error and the session-clearing hook did not run

### Requirement: Retries are bounded and idempotent-only

The gateway SHALL automatically retry a request only when its method is safe (GET, HEAD, or OPTIONS) and the failure is transient: a network error, a server error, or a rate-limit answer whose envelope marks the request retryable. An envelope that explicitly declares the request not retryable SHALL NOT be retried. Mutating methods SHALL never be retried by the gateway. Total attempts per request SHALL be bounded by configuration.

#### Scenario: A safe method is retried within the bound and then succeeds

- **WHEN** a GET is answered twice with 503 and then 200, with the attempt bound above three
- **THEN** the request resolves successfully and the transport saw exactly three attempts

#### Scenario: Exhausting the bound surfaces the last failure

- **WHEN** a GET is answered 503 on every attempt up to the configured bound
- **THEN** the request rejects with a terminal error and the transport saw exactly the bound number of attempts

#### Scenario: A mutating method is never auto-retried

- **WHEN** a POST is answered 503
- **THEN** the request rejects immediately and the transport saw exactly one attempt

#### Scenario: An explicit not-retryable envelope suppresses retry

- **WHEN** a GET is answered 503 with an ErrorEnvelope whose retryable field is false
- **THEN** the request rejects without a second transport attempt

### Requirement: Every failure normalizes into exactly one typed kind

The gateway SHALL resolve every failure into exactly one of: offline, unauthenticated, revoked, forbidden, unsupported, not-found, invalid, partial, or terminal. The HTTP status decides the kind — 400 invalid, 401 unauthenticated, 403 forbidden, 404 not-found, 501 unsupported, other 4xx terminal — and each error SHALL carry the fields the platform ErrorEnvelope supplied (`code`, `message`, `retryable`, `field_violations`, `correlation_id`, `trace_id`) whenever they were present. An error body that is absent or not parseable JSON SHALL still classify by status without inventing any wire field.

#### Scenario: Validation failure carries field-level detail

- **WHEN** a request is answered 400 with an ErrorEnvelope holding two field violations
- **THEN** the gateway rejects with kind invalid and both violations are present on the error

#### Scenario: Statuses map to their kinds

- **WHEN** requests are answered 403, 404, 401, and 501 respectively
- **THEN** the kinds are forbidden, not-found, unauthenticated, and unsupported

#### Scenario: An unparseable error body still classifies

- **WHEN** a request is answered 404 with a body that is not JSON
- **THEN** the gateway rejects with kind not-found and carries none of the envelope fields

#### Scenario: A server failure after retries is terminal and keeps the retryable flag

- **WHEN** a GET exhausts its attempt bound against 503 answers carrying an ErrorEnvelope with retryable true
- **THEN** the gateway rejects with kind terminal whose retryable field is true

### Requirement: Caller cancellation propagates everywhere

The gateway SHALL pass the caller's abort signal to the underlying transport on every attempt, including a replay after refresh. A caller abort SHALL reject the request with the caller's abort reason and SHALL NOT be retried, refreshed over, or normalized into a gateway error.

#### Scenario: An already-aborted signal reaches the transport and rejects untouched

- **WHEN** a request is issued with an abort signal that is already aborted
- **THEN** the underlying fetch received that signal and the request rejects with the abort reason rather than a normalized gateway error

#### Scenario: An aborted request is not retried

- **WHEN** a request in flight is aborted by the caller
- **THEN** no further transport attempt for it follows

### Requirement: Cache keys derive from API paths and parameters

The gateway's key factory SHALL build query keys from an API path template plus path and query parameters such that identical inputs always produce deep-equal keys regardless of parameter insertion order or repeated calls, different parameters produce different keys, and a path parameter expands into its own key segment.

#### Scenario: Repeated construction and reordered parameters are stable

- **WHEN** a key is built twice from the same template with the same query parameters inserted in different orders
- **THEN** both keys are deep-equal

#### Scenario: Distinct parameters produce distinct keys

- **WHEN** keys are built from one operation path template with two different operation identifiers
- **THEN** the keys differ

#### Scenario: A path parameter becomes its own segment

- **WHEN** a key is built from `/v1/operations/{operation_id}` with an identifier
- **THEN** the produced tuple ends with that identifier as its final segment
