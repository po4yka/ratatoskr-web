## Purpose

Lets an authorized owner inspect bounded operation, schedule, and audit projections while keeping
Platform's live authorization and redaction authoritative.

## ADDED Requirements

### Requirement: Operations inspector renders bounded server truth

The operations view SHALL request generated admin operation list and detail routes, paginate by the
server cursor, and render every contracted lifecycle including failure and partial success with only
the user-safe failure code.

#### Scenario: Failed and partially succeeded rows stay distinct
- **WHEN** a page contains one failed operation and one partially succeeded operation
- **THEN** both exact lifecycle labels render and no private diagnostic appears

#### Scenario: Cursor advances the server page
- **WHEN** a response contains a next cursor and the owner activates the next-page control
- **THEN** the next request carries that cursor rather than filtering an unbounded local collection

#### Scenario: Empty operations differ from a failed request
- **WHEN** Platform successfully returns no operation rows
- **THEN** the view renders an empty state distinct from offline, forbidden, and terminal errors

### Requirement: Schedule inspection preserves unknown and disabled facts

The schedule view SHALL render bounded cursor pages, enabled state, next due time, and an absent or
present last outcome without displaying command payloads or configuration.

#### Scenario: Never-run schedule remains unknown
- **WHEN** a schedule has no last outcome
- **THEN** the view names that no run has been observed rather than synthesizing success

#### Scenario: Disabled failed schedule remains visible
- **WHEN** Platform returns a disabled schedule with a failed last outcome
- **THEN** both disabled and failed labels remain readable

### Requirement: Audit inspection keeps attribution bounded and honest

The audit view SHALL render action, outcome, target, correlation, occurrence time, and actor fields
from bounded cursor pages and SHALL NOT invent an actor or expose payload export.

#### Scenario: System event has no actor
- **WHEN** an audit row omits actor user and session identifiers
- **THEN** the view labels the actor as unavailable without substituting an owner

#### Scenario: Empty audit differs from failure
- **WHEN** Platform successfully returns an empty audit page
- **THEN** the view renders an explicit empty history state unlike offline or forbidden

### Requirement: Operational errors remain actionable and distinct

Each operational view SHALL distinguish loading, empty, offline, forbidden, partial, and terminal
failure states and SHALL provide retry for recoverable reads without logging private response data.

#### Scenario: Revoked owner reaches a stale route
- **WHEN** Platform returns forbidden after a previously visible operational link is activated
- **THEN** the view renders the server refusal and reveals no operational rows
