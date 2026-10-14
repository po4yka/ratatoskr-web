## Purpose

Give the owner a capability-gated surface to connect an Obsidian vault, follow the connect
operation, browse the vault files read-only with their backlinks, and disconnect the vault. The
shared behaviour lives in the workspace store, specs `notes-vault-connections` and
`notes-file-index` of change `add-notes-vault-connections`.

## ADDED Requirements

### Requirement: The end-to-end password is asked only after the server-access notice

The connect form SHALL state that the server can read every file of the vault, also when the vault
uses end-to-end encryption. The form SHALL NOT show the end-to-end password field until the owner
accepts that notice, and SHALL NOT send a connect request while the notice is not accepted.

#### Scenario: The owner opens the connect form

- **WHEN** the owner opens `/notes` in a deployment with `notes.vaults`
- **THEN** the end-to-end password field is absent, and it is present after the owner accepts the notice, verified by `src/features/notes/connect.test.tsx` "the end-to-end password is asked only after the server-access notice is accepted"

### Requirement: Typed secrets are sent once and kept nowhere

The connect form SHALL send the Obsidian password, the MFA code and the end-to-end password only in
the body of `POST /v1/notes/connections`. It SHALL NOT put them in a URL, in browser storage, in a
log call or in the rendered document after the submit.

#### Scenario: The owner submits the form with marker secrets

- **WHEN** the owner submits the connect form with marker values for the three secrets
- **THEN** the request body holds them once, and after the submit no input, no storage entry, no URL and no console call holds a marker, verified by `src/features/notes/connect.test.tsx` "the typed secrets are sent once and kept nowhere after submit"

### Requirement: The connect operation and its failures are shown

The view SHALL show the status and the stage of the `notes.connection.connect` operation, and SHALL
show each stable notes error code as its own message. The view SHALL follow the operation that the
`202` answer of Edge names, and the connect request SHALL NOT carry an `Idempotency-Key`, because
Edge keeps no digest of the body. The view SHALL name the phases `login`, `setup`, `first_sync` and
`indexing` as steps of four, and SHALL show one message for each terminal error code and warning of
the operation, from `ratatoskr-notes`, from Edge, or from the stale-operation reaper of Platform.

#### Scenario: The operation is in its first sync

- **WHEN** the connect answer names an operation whose snapshot is `running` with the stage `first_sync`
- **THEN** the view shows the stage, verified by `src/features/notes/connect.test.tsx` "the connect operation shows its stage"

#### Scenario: The connect follows the operation of Edge

- **WHEN** Edge answers `202` with `{ operation_id, status, connection }`
- **THEN** the view reads `/v1/operations/{operation_id}` and the request has no `Idempotency-Key`, verified by `src/features/notes/connect-operation.test.tsx` "the connect sends no Idempotency-Key and follows the operation that Edge names"

#### Scenario: Each phase is a named step

- **WHEN** the snapshot is `running` with the stage `login`, `setup`, `first_sync` or `indexing`
- **THEN** the view names the phase as step 1, 2, 3 or 4 of 4, verified by `src/features/notes/connect-operation.test.tsx` "the connect operation names the phase %s"

#### Scenario: A terminal code or a warning has its own message

- **WHEN** the snapshot is `failed` with a code of `ratatoskr-notes`, of Edge or `platform.operation.stale`, or `partially_succeeded` with `notes.sync.journal_unreadable`
- **THEN** the view shows the message of that code, verified by `src/features/notes/connect-operation.test.tsx` "a failed connect operation names the reason of %s" and "a connect that ends with a warning names the warning"

#### Scenario: The end-to-end password is wrong

- **WHEN** the connect request fails with `notes.sync.e2e_password_wrong`
- **THEN** the view shows that the end-to-end password is wrong, verified by `src/features/notes/connect.test.tsx` "a failed login names its reason"

### Requirement: The vault is browsed read-only with backlinks

The view SHALL list the connections with their channel and state, list the files of one connection,
show the text of one file and the files that link to it, and offer no control that changes a file.
A disconnect SHALL ask for a confirmation that names the vault.

#### Scenario: The owner opens a file

- **WHEN** the owner opens a file of a connection
- **THEN** the view shows its text and its backlinks and no editable field, verified by `src/features/notes/browse.test.tsx` "a file shows its text and its backlinks and cannot be edited"

#### Scenario: The owner disconnects a vault

- **WHEN** the owner selects disconnect for a vault
- **THEN** no request is sent until the owner confirms in a dialog that names the vault, verified by `src/features/notes/browse.test.tsx` "a disconnect is sent only after a confirmation that names the vault"
