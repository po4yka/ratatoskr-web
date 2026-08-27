## Purpose

Give a user an honest, capability-gated view of GitHub catalog state and Git
Vault restore evidence without treating fixture data as a live integration.

## ADDED Requirements

### Requirement: GitHub catalog is capability-gated and integration-aware

The client SHALL use the held capability document to decide whether GitHub
catalog and Git Vault routes are available. When their live Edge API contract
is absent, the client SHALL use contract-fixed fixture projections, visibly
mark the integration as pending, and SHALL not issue an invented network
request. An absent capability SHALL render the existing explained absence
instead of a disabled or failing control.

#### Scenario: Deployment lacks the catalog service

- **WHEN** the capability document does not include the GitHub catalog feature
- **THEN** the catalog route renders the explained unavailable state and does
  not render connection or repository controls

#### Scenario: Fixture-backed integration is pending

- **WHEN** the pinned Edge contract has no GitHub catalog or Git Vault route
- **THEN** the available route renders only its contract-fixed fixture data and
  identifies live integration as pending

### Requirement: GitHub connection preserves credential custody

The client SHALL provide a labelled personal-access-token form that rejects an
empty token and submits only after validation. Where its source supplies a
provider authorization URL, it SHALL offer a PKCE authorization redirect. The
client SHALL never display, log, or retain the personal access token after the
submission operation completes.

#### Scenario: Empty token is rejected

- **WHEN** a user submits the connection form without a personal access token
- **THEN** the form reports the validation error and sends no submission

#### Scenario: Valid token submits through the current source

- **WHEN** a user submits a non-empty personal access token
- **THEN** the source receives one connection request and the control reports
  the source outcome without echoing the token

#### Scenario: OAuth facade supplies an authorization URL

- **WHEN** the current source supplies a GitHub PKCE authorization URL
- **THEN** the connection surface offers a provider redirect control that
  navigates to that exact supplied URL

### Requirement: Repository catalog and detail preserve supplied state

The client SHALL list each supplied repository with its provider metadata and
star, tracked, or ignored state. Selecting a repository SHALL show its supplied
analysis only when present; the absence of analysis SHALL be described without
synthesizing results.

#### Scenario: Repository metadata is listed

- **WHEN** the available catalog source returns repositories
- **THEN** each row identifies the repository and its supplied catalog state

#### Scenario: Detail has no analysis

- **WHEN** a selected repository has no analysis payload
- **THEN** the detail states that analysis is unavailable and renders no
  invented analysis section

### Requirement: Catalog writes require named consent

The client SHALL require an explicit confirmation dialog before a user changes
the tracked or starred state of a repository. The dialog SHALL name the target
repository and the consequence, and SHALL issue the write only after its
confirmation control is activated.

#### Scenario: Dismissing a pending write

- **WHEN** a user closes or cancels the confirmation dialog
- **THEN** the source receives no track or star write

#### Scenario: Confirming a named write

- **WHEN** a user confirms the dialog for a named repository state change
- **THEN** the source receives exactly that state-change request

### Requirement: Git Vault evidence is rendered without inference

The client SHALL list supplied mirror health and snapshots per mirror,
including each supplied manifest digest. A restore-drill view SHALL show only
the supplied pass or fail result, timestamps, and timings, and SHALL report a
backup as verified only when the evidence explicitly reports a passing drill.

#### Scenario: Snapshot carries a manifest digest

- **WHEN** a mirror snapshot contains a manifest digest
- **THEN** the snapshot view displays that exact digest with its mirror

#### Scenario: Passing restore drill is evidenced

- **WHEN** a restore-drill payload reports a passing result with timing data
- **THEN** the evidence view displays the result, supplied timestamps, and
  timings as restore-verification evidence

#### Scenario: Failing restore drill is not verified

- **WHEN** a restore-drill payload reports a failing result
- **THEN** the evidence view identifies the failure and does not label the
  mirror, snapshot, or backup verified
