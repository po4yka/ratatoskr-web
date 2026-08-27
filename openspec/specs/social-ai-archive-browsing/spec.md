# Social AI Archive Browsing Specification

## Purpose

Give users a truthful, capability-gated reader for preserved social posts and
AI-provider exports without treating unavailable data or provider access as
archive evidence.

## Requirements

### Requirement: Social and AI archive surfaces are capability-gated and integration-aware

The client SHALL use its held capability document to decide whether each social
provider, AI archive, and connection-management surface is available. When the
pinned Edge contract has no matching operation or capability, the client SHALL
use contract-fixed fixture projections, identify the integration as pending,
and SHALL not issue an undeclared network request.

#### Scenario: Provider capability is absent

- **WHEN** a deployment omits the fixture capability for a social or AI provider
- **THEN** its navigation entry is absent and a direct route renders the existing explained unavailable state without reader or connection controls

#### Scenario: Fixture integration is pending

- **WHEN** an available social or AI route renders while its Edge contract is absent
- **THEN** it displays the supplied fixture projection and identifies live integration as pending without creating an Edge request

### Requirement: Social posts retain supplied acquisition provenance

The client SHALL list and render each supplied social post with an explicit
provenance label that maps bookmark snapshot, explicit capture, and import to
distinct readable labels. It SHALL offer a supplied folder filter only when
folders exist, and SHALL link to a related document only when the source
supplies an extracted Document IR identifier.

#### Scenario: Post provenance is mapped

- **WHEN** a social fixture contains bookmark-snapshot, explicit-capture, and import posts
- **THEN** the list and each corresponding detail render the distinct readable provenance labels without deriving one from the provider or post fields

#### Scenario: Folder and extracted article are supplied

- **WHEN** a post fixture supplies a folder and a related Document IR identifier
- **THEN** the folder filter can select that post and its detail offers a link to that document

#### Scenario: Post lacks an extracted article

- **WHEN** a post fixture has no related Document IR identifier
- **THEN** its detail does not render a document link or claim that extraction occurred

### Requirement: AI archives render imported records and completeness without inference

The client SHALL list supplied ChatGPT and Claude imports with their stated
import outcome and completeness report. It SHALL render each supplied
conversation's ordered messages and typed content parts, group conversations
under their supplied projects, and render artifacts with all supplied versions
without inventing missing messages, projects, artifacts, or completeness.

#### Scenario: Conversation export is rendered in order

- **WHEN** a fixture export supplies a project conversation with ordered messages and text, code, and attachment content parts
- **THEN** the reader displays the project grouping, messages in supplied order, and each supplied part type

#### Scenario: Import reports a gap

- **WHEN** an import fixture reports an incomplete outcome and named gaps
- **THEN** the archive list displays that outcome and gaps without presenting the archive as complete

#### Scenario: Artifact versions are supplied

- **WHEN** a Claude fixture supplies an artifact with multiple versions
- **THEN** its artifact view lists each supplied version and does not collapse them into one current version

### Requirement: Local backup status requires preservation evidence

The client SHALL display an AI conversation, project, or artifact as locally
backed up only when its supplied local preservation evidence explicitly states
that it is locally backed up. Missing, reference-only, or non-verified evidence
SHALL render as not locally backed up, and provider authorization or connection
state SHALL not alter the displayed preservation result.

#### Scenario: Verified local evidence is displayed

- **WHEN** a Claude fixture supplies explicit locally-backed-up evidence for an artifact
- **THEN** the artifact view states that it is locally backed up and identifies the supplied evidence

#### Scenario: Missing evidence remains reference-only

- **WHEN** a project or conversation fixture has no local preservation evidence
- **THEN** its view states that it is reference-only or not locally backed up and never uses a backed-up label

#### Scenario: Expired authorization preserves prior evidence result

- **WHEN** a fixture reports expired provider authorization alongside explicit local preservation evidence
- **THEN** the displayed local-backup status follows that evidence rather than the authorization state

### Requirement: Provider connections follow supplied authority and explicit intent

The client SHALL expose connection controls only for providers available in the
held capability document. It SHALL navigate to an OAuth authorization URL only
when the current source supplies the exact URL. Disconnecting a provider SHALL
require named confirmation and invoke only the current source; provider tokens,
OAuth callbacks, and server-side revocation remain outside the browser.

#### Scenario: Supplied authorization URL is offered

- **WHEN** an available provider fixture supplies an OAuth authorization URL
- **THEN** its connection page offers a link to exactly that URL without constructing OAuth state or a callback

#### Scenario: Authorization URL is absent

- **WHEN** an available provider fixture has no OAuth authorization URL
- **THEN** its connection page explains that authorization cannot start and renders no disabled redirect control

#### Scenario: Disconnect is confirmed before invocation

- **WHEN** a user cancels a disconnect confirmation for a named connected provider
- **THEN** the source receives no disconnect request

#### Scenario: Confirmed disconnect follows the source result

- **WHEN** a user confirms disconnect for a named connected provider
- **THEN** the source receives exactly one disconnect request and the page reports its supplied result without claiming a provider-side revocation in fixture mode
