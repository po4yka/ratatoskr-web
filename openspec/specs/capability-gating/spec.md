# capability-gating Specification

## Purpose
The client learns what this deployment can do from Platform's capability document rather than
assuming, decides feature availability through one typed rule, reflects the decision in navigation,
and explains an absent capability truthfully instead of shipping a dead route.

## Requirements

### Requirement: Capability discovery for authenticated sessions

The client SHALL read the capability document from `GET /v1/capabilities` through the gateway when
a session is authenticated, SHALL hold that document as the only source of gating truth, SHALL
refresh it when connectivity returns after a loss, and SHALL treat a failed read as its own
recoverable state — never as evidence about which capabilities exist. No capability request SHALL
be sent while unauthenticated.

#### Scenario: The document arrives for an authenticated session

- **WHEN** the client renders the protected shell with a standing session
- **THEN** the capability document Platform returned is held and available to every gating decision

#### Scenario: A failed capability read stays its own state

- **WHEN** the capability read cannot reach Platform or returns an unusable answer
- **THEN** the client holds no document, reports that availability cannot be decided, offers retry,
  and re-reads on success — without ever inferring a capability set from the failure

#### Scenario: Connectivity returning refreshes the document

- **WHEN** the browser reports connectivity restored after a loss
- **THEN** the client reads the capability document again and gates against what the fresh answer says

#### Scenario: No capability traffic while signed out

- **WHEN** no session stands
- **THEN** the client sends no capability request at all

### Requirement: One typed rule decides feature availability

Each client feature SHALL declare the single capability it requires, if any, using a name drawn
from the closed vocabulary this client knows; a requirement outside that vocabulary SHALL be a
compile error. Availability SHALL resolve through exactly one total function over (requirement,
held document, document load state) to one verdict: available, pending, undecidable, or unavailable
naming the missing capability. A feature without a requirement SHALL always be available. An
unfamiliar name in the document SHALL gate nothing, because it names a feature this client does not
implement.

#### Scenario: A requirement met by the document

- **WHEN** a feature requires a capability and the held document lists it
- **THEN** the verdict is available

#### Scenario: A requirement absent from the document

- **WHEN** a feature requires a capability the held document does not list
- **THEN** the verdict is unavailable and names the missing capability

#### Scenario: The vocabulary is closed on the client side

- **WHEN** a document carries names this client has never heard of alongside familiar ones
- **THEN** familiar requirements still resolve correctly and unfamiliar names decide nothing

#### Scenario: An empty document gates everything gated away

- **WHEN** the held document lists no capabilities
- **THEN** every feature with a requirement is unavailable, and features without one stay available

#### Scenario: No verdict before the document exists

- **WHEN** the capability read has not answered yet
- **THEN** gated features hold a pending verdict, ungated features do not wait for it

#### Scenario: An unreachable deployment is undecidable, not absent

- **WHEN** the capability read failed and no document is held
- **THEN** gated features resolve to undecidable — never to unavailable, which would claim knowledge
  the client does not have

### Requirement: Navigation reflects the gate

The shell SHALL render its primary navigation entries from the feature registry filtered by their
verdicts: an entry renders only when its verdict is available. Ungated entries SHALL render in
every load state. Operations, schedules, and audit SHALL each declare and follow their own exact
operational capability rather than sharing an owner flag.

#### Scenario: A gated entry appears when its capability appears

- **WHEN** the held document lists the capability a navigation entry requires
- **THEN** the entry renders among the primary navigation

#### Scenario: A gated entry disappears when its capability disappears

- **WHEN** the held document does not list the capability a navigation entry requires
- **THEN** the entry does not render, and no dead control takes its place

#### Scenario: Core entries survive any load state

- **WHEN** the capability read is pending or has failed
- **THEN** navigation entries without a requirement still render

#### Scenario: Operational destinations gate independently

- **WHEN** the document contains only a subset of the three operational capabilities
- **THEN** navigation renders only the matching operations, schedules, or audit destinations

### Requirement: Gated routes explain themselves

A direct visit to a route whose required capability is absent SHALL render a truthful explained
absence naming that the deployment does not offer the capability, distinct from the not-found
surface, offline states, pending states, and Platform forbidden. While the document load is pending
the route region SHALL hold its designed pending state; while the read is undecidable the route
region SHALL offer the failure state with working retry; when the requirement is met the route's
view SHALL render; and a later server refusal SHALL remain visible.

#### Scenario: Direct URL into an ungated capability shows the explained absence

- **WHEN** a user opens the address of a route whose required capability the held document does not
  list
- **THEN** the route region renders the deployment-lacks-it explanation, the shell stays around it,
  and nothing resembling the feature's view renders

#### Scenario: The explained absence is not the not-found surface

- **WHEN** the same address is visited while the document lists the required capability
- **THEN** the route's view renders, proving the absence surface answers the gate and not the address

#### Scenario: Undecidable holds the route with a way back

- **WHEN** a user opens a gated route's address while the capability read has failed
- **THEN** the route region renders its failure state with retry, and a successful retry admits the
  route or refuses it according to the fresh answer

#### Scenario: Server refusal overrides stale presentation

- **WHEN** a route was admitted from a held capability document and Platform later returns forbidden
- **THEN** the route renders the forbidden response and no previously admitted data
