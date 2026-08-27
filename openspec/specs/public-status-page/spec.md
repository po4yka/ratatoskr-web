# public-status-page Specification

## Purpose

Lets any visitor read a sanitized, truthful deployment status without starting an authenticated
session or learning private topology.

## Requirements

### Requirement: Public status remains outside session boot

The `/status` route SHALL request only `GET /v1/status`, SHALL NOT start session or capability
discovery, and SHALL remain available to a signed-out visitor without redirecting to login.

#### Scenario: Anonymous visitor opens degraded status

- **WHEN** a signed-out visitor opens `/status` and Platform reports a degraded stale component
- **THEN** the page names the overall degradation and the component's degraded and stale facts

#### Scenario: Public status sends no authenticated boot requests

- **WHEN** the status page loads successfully
- **THEN** its only Platform request is the anonymous status request

### Requirement: Status presentation preserves every contracted state

The page SHALL render operational, degraded, unavailable, and unknown component states with text,
SHALL label stale observations, and SHALL distinguish loading, endpoint failure, and a successful
document without components.

#### Scenario: Endpoint becomes unreachable after a successful read

- **WHEN** refresh loses transport after a prior status document was rendered
- **THEN** the page reports the connection failure and labels any retained facts as stale

#### Scenario: Required component is unavailable

- **WHEN** Platform reports an unavailable component and unavailable overall state
- **THEN** both states are named and neither is presented as healthy or empty

### Requirement: Public status is a semantic standalone document

The route SHALL provide one main landmark, one primary heading, descriptive document metadata,
keyboard-operable retry, visible focus, and state information that does not depend on colour.

#### Scenario: Keyboard visitor retries status

- **WHEN** status loading fails and the visitor tabs to Retry and activates it with Enter or Space
- **THEN** a new status request starts and focus remains visible
