## MODIFIED Requirements

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
