## Purpose

The client resolves who is using it before any app route renders: it probes session validity through the gateway, holds the credential under the approved storage decision, signs in with a credential Platform accepts, signs out through one provider interface, and renders an explicit unauthorized surface with a path forward when there is no session.

## ADDED Requirements

### Requirement: Boot resolution before rendering

The client SHALL resolve exactly one boot outcome — authenticated, unauthenticated, or backend-unreachable — before rendering any application route, and SHALL render a designed boot state, never a flash of protected content or a blank screen, for as long as the decision is pending.

#### Scenario: Valid session reaches the shell
- **WHEN** the client boots with stored custody of a credential Platform still authenticates
- **THEN** the probe answers success and the protected shell renders with the requested route inside it

#### Scenario: Expired or refused credential reaches the unauthorized surface
- **WHEN** the client boots with stored custody of a credential Platform refuses
- **THEN** the probe answers unauthenticated, stored custody is discarded, and the unauthorized surface renders with a path to sign in

#### Scenario: No stored custody skips the wire
- **WHEN** the client boots with no stored credential at all
- **THEN** the client resolves unauthenticated without sending a probe request, and the unauthorized surface renders

#### Scenario: Unreachable backend shows a boot-failure state
- **WHEN** the probe cannot reach Platform at all
- **THEN** a boot-failure state renders that says the deployment could not be reached and offers retry, and no route renders as if the user were signed out

### Requirement: Credential custody follows the approved storage decision

The client SHALL hold the bearer credential only where the approved storage ADR allows, SHALL make custody observable to the gateway as the token source, and SHALL discard custody completely on sign-out or on a confirmed revocation.

#### Scenario: Custody survives a reload within its stated lifetime
- **WHEN** the user reloads the tab after signing in
- **WHEN** the boot sequence runs again
- **THEN** the stored credential is found, probed, and the shell renders without asking again

#### Scenario: Discarding custody leaves nothing behind
- **WHEN** sign-out completes or a revocation is confirmed
- **THEN** no readable credential remains in any storage the client controls

### Requirement: Signing in with an existing Platform credential

The client SHALL let a user sign in by presenting an existing Platform credential, SHALL probe it through an authenticated read before taking custody so an unusable credential never becomes custody, and SHALL NOT invent request or response shapes for endpoints the pinned contract does not define.

#### Scenario: A usable credential establishes the session
- **WHEN** the user submits a credential that the probe authenticates
- **THEN** custody is taken, the client reports authenticated, and the user lands in the shell

#### Scenario: An unusable credential is refused without taking custody
- **WHEN** the user submits a credential the probe refuses
- **THEN** the form shows a truthful refusal message, no custody is taken, and the client stays unauthenticated

#### Scenario: A submission that cannot reach Platform is not a refusal
- **WHEN** the probe fails because Platform is unreachable rather than because the credential is wrong
- **THEN** the form distinguishes that failure from a bad credential and lets the user retry

### Requirement: Signing out goes through one provider operation

The client SHALL perform sign-out through the auth provider's single revoke operation, SHALL land the user on the unauthorized surface afterwards, and SHALL label truthfully what happened server-side: until Platform exposes a revocation endpoint, the client SHALL say the session was ended locally rather than claim a server-side revoke it did not perform.

#### Scenario: Sign-out ends the session everywhere in the client
- **WHEN** the user confirms sign-out from the user menu
- **THEN** the provider's revoke operation runs once, custody is discarded, in-flight authenticated requests are not replayed against the dead session, and the unauthorized surface renders

#### Scenario: Sign-out labels what the server did
- **WHEN** Platform defines no revocation endpoint for this contract version
- **THEN** the confirmation and any post-sign-out notice say the session ended on this device, without asserting server-side revocation

### Requirement: The protected shell and the unauthorized surface

Every route except `/login` SHALL render inside the authenticated shell — a navigation skeleton, a theme switcher offering light, dark, and system, and a user menu carrying sign-out — and each feature route SHALL load its own view code so the shell does not wait on views the user has not opened. The shell SHALL be keyboard operable with visible focus and a skip link into the main region. Direct navigation to a protected URL without a session SHALL render the unauthorized surface with a sign-in entry, and after signing in the user SHALL arrive at the URL they asked for.

#### Scenario: Deep link to a protected route while signed out
- **WHEN** the user opens a protected URL with no session
- **THEN** the unauthorized surface renders with a working sign-in entry, and after a successful sign-in the originally requested URL renders

#### Scenario: Theme choice persists across the switcher
- **WHEN** the user picks light, dark, or system in the theme switcher
- **THEN** the resolved theme changes immediately, the choice persists across a reload, and the switcher indicates which option is active

#### Scenario: User menu exposes sign-out to the keyboard
- **WHEN** the user opens the user menu from the keyboard
- **THEN** sign-out is reachable and activatable without a pointer, with visible focus throughout

#### Scenario: A lazily loaded route has a loading state
- **WHEN** a feature route's view code is still arriving after navigation
- **THEN** a designed pending state renders in place of the route region, not a blank area
