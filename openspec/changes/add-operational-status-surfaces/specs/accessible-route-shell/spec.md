## Purpose

Defines the observable keyboard, focus, landmark, contrast, responsive, and audit-evidence guarantees
for the public status page, operational routes, and their shared shell.

## ADDED Requirements

### Requirement: Route navigation places logical focus

The affected routers SHALL move focus to the destination's primary heading after user navigation,
SHALL NOT steal focus during background refresh, and SHALL return focus to the invoking control when
a disclosure or dialog closes.

#### Scenario: Route changes focus the destination heading
- **WHEN** a keyboard user activates a navigation link
- **THEN** the new route's primary heading receives programmatic focus with a visible indicator

#### Scenario: Refresh preserves current focus
- **WHEN** background data refresh completes while focus is on an interactive control
- **THEN** focus remains on that control

### Requirement: Every affected interaction is keyboard operable

The skip link, navigation, retry and pagination controls, disclosures, theme control, and dialogs
SHALL be reachable in logical order and operable with their expected Enter, Space, and Escape keys.

#### Scenario: Skip link reaches main content
- **WHEN** a keyboard user activates the first skip link
- **THEN** focus moves to the main landmark and subsequent traversal starts in route content

#### Scenario: Disclosure closes with Escape
- **WHEN** a focused disclosure is open and the user presses Escape
- **THEN** it closes and focus returns to its trigger

### Requirement: Accessibility evidence covers the real route matrix

The repository SHALL commit a checklist covering public status, member operational refusal, owner
operations, schedules, audit, login, search, and reader in both themes at narrow and wide viewports.
It SHALL record automated findings, keyboard/landmark/focus/contrast/reduced-motion/target-size/mobile
checks, fixes, and manual checks that remain unverified.

#### Scenario: Automated route matrix is accepted
- **WHEN** axe runs over the route matrix in both themes and viewports
- **THEN** no serious or critical finding remains accepted without a failing regression and fix

#### Scenario: Manual screen-reader evidence was not observed
- **WHEN** no human screen-reader session was performed
- **THEN** the checklist marks it unverified rather than passed
