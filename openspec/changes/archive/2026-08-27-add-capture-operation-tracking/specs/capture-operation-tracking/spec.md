## Purpose

Lets an authenticated user submit a URL capture and follow its durable outcome
without mistaking a transport failure or a partial result for a completed one.

## ADDED Requirements

### Requirement: URL capture submission is validated and idempotent
The client SHALL render the capture control only when `content.submit` is
available, reject a value that is not an HTTP(S) URL with a host before
submission, and retain one client idempotency key while the same submission is
being retried. A new user retry after a terminal failure SHALL submit a new
operation with a new key.

#### Scenario: repeated delivery keeps one accepted operation
- **WHEN** a transient submission failure is retried for the same URL
- **THEN** the client sends the same idempotency key and presents the operation
  returned for that original request

#### Scenario: invalid URL stays local
- **WHEN** a user submits a URL without an HTTP(S) scheme or host
- **THEN** the client describes the validation error and sends no request

### Requirement: Operation progress is truthful and recoverable
The client SHALL render status, stage, percentage, warnings, errors, and
results from the public operation snapshot and progress stream. It SHALL keep
the displayed snapshot monotonic under duplicate or out-of-order events. A
dropped stream SHALL trigger visible polling, and polling SHALL continue until
a terminal snapshot is observed.

#### Scenario: stream loss recovers a terminal outcome
- **WHEN** a live operation stream drops before its terminal event arrives
- **THEN** the client announces polling recovery and renders the terminal
  snapshot returned by polling exactly once

#### Scenario: fixture phases remain payload-driven
- **WHEN** a fixture stream supplies queued, running stages and a terminal
  success snapshot
- **THEN** the progress view displays those supplied stages and outcome without
  mapping a stage vocabulary to locally invented phases

### Requirement: Terminal capture outcomes remain qualified
The client SHALL automatically navigate to a supplied analysis result only
after a succeeded terminal snapshot names one. A partially-succeeded result
SHALL remain available as an explicit action while every warning stays visible.
A failed or cancelled operation SHALL show its safe errors and offer retry only
when the snapshot declares it retryable.

#### Scenario: degraded extraction remains visible
- **WHEN** a terminal operation is partially succeeded with a result and a
  warning
- **THEN** the client displays the warning as part of the outcome and offers
  the result as an explicit action

#### Scenario: retry starts new work
- **WHEN** a terminal failed operation is marked retryable and the user selects
  retry
- **THEN** the client submits a new capture operation rather than reopening the
  failed operation as if it were running

### Requirement: Recent captures use the operation list
The client SHALL render a bounded recent-capture list from operations of the
capture kind, including each operation's state and an explained absence when
no capture operation exists. Local read and favorite controls SHALL change only
client presentation state until the archive-preference contract exists.

#### Scenario: a capture list remains bounded
- **WHEN** the operation list returns a page of capture operations and a next
  cursor
- **THEN** the client renders that page and does not fetch every operation to
  filter it in the browser
