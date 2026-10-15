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
show each stable notes error code as its own message.

#### Scenario: The operation is in its first sync

- **WHEN** the connect answer names an operation whose snapshot is `running` with the stage `first_sync`
- **THEN** the view shows the stage, verified by `src/features/notes/connect.test.tsx` "the connect operation shows its stage"

#### Scenario: The end-to-end password is wrong

- **WHEN** the connect request fails with `notes.sync.e2e_password_wrong`
- **THEN** the view shows that the end-to-end password is wrong, verified by `src/features/notes/connect.test.tsx` "a failed login names its reason"

### Requirement: The connect follows the operation that Edge names

The view SHALL follow the operation that the `202` answer of Edge names. The connect request SHALL
NOT carry an `Idempotency-Key`, because Edge keeps no digest of the body.

#### Scenario: The connect follows the operation of Edge

- **WHEN** Edge answers `202` with `{ operation_id, status, connection }`
- **THEN** the view reads `/v1/operations/{operation_id}` and the request has no `Idempotency-Key`, verified by `src/features/notes/connect-operation.test.tsx` "the connect sends no Idempotency-Key and follows the operation that Edge names"

### Requirement: Each phase and each terminal code of the connect has its own text

The view SHALL name the phases `login`, `setup`, `first_sync` and `indexing` as steps of four. It
SHALL show one message for each terminal error code and warning of the operation, from
`ratatoskr-notes`, from Edge, or from the stale-operation reaper of Platform.

#### Scenario: Each phase is a named step

- **WHEN** the snapshot is `running` with the stage `login`, `setup`, `first_sync` or `indexing`
- **THEN** the view names the phase as step 1, 2, 3 or 4 of 4, verified by `src/features/notes/connect-operation.test.tsx` "the connect operation names the phase %s"

#### Scenario: A terminal code or a warning has its own message

- **WHEN** the snapshot is `failed` with a code of `ratatoskr-notes`, of Edge or `platform.operation.stale`, or `partially_succeeded` with `notes.sync.journal_unreadable`
- **THEN** the view shows the message of that code, verified by `src/features/notes/connect-operation.test.tsx` "a failed connect operation names the reason of %s" and "a connect that ends with a warning names the warning"

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

### Requirement: The file and its index come from the notes read routes

The view SHALL read the bytes of a file from `GET /v1/notes/connections/{id}/files/{*path}`, and its
links, tags, properties and backlinks from `GET /v1/notes/connections/{id}/index/{*path}`, with the
file path sent as path segments. A file that is not UTF-8 text SHALL be named as not text, and
`notes.file.not_found` SHALL have its own message.

#### Scenario: The file and its index come from the read routes

- **WHEN** the owner opens `Projects/Plan.md`
- **THEN** the view reads `.../files/Projects/Plan.md` and `.../index/Projects/Plan.md`, verified by `src/features/notes/file-panel.test.tsx` "a file is read by its path segments, from the file and index routes"

#### Scenario: The index shows links, tags and properties

- **WHEN** the index of the file has a resolved link, a link without a target, a tag and a frontmatter property
- **THEN** the view links the resolved target, marks the other link as not in the vault, and shows the tag and the property, verified by `src/features/notes/file-panel.test.tsx` "a file shows its links, tags and properties from the index"

#### Scenario: A file is not text, or is gone

- **WHEN** the bytes of the file are not UTF-8, or the file route answers `notes.file.not_found`
- **THEN** the view says that the file is not text, or that it does not exist in the vault now, verified by `src/features/notes/file-panel.test.tsx` "a file that is not text says so" and "a file that is gone names the reason"

### Requirement: A disconnect that the server cannot finish is named

The view SHALL show `notes.connection.cleanup_failed` as a disconnect that did not happen and that
the owner can try again.

#### Scenario: The server cannot finish a disconnect

- **WHEN** the disconnect answers `notes.connection.cleanup_failed`
- **THEN** the view says that the vault is still connected and to try again later, verified by `src/features/notes/browse.test.tsx` "a disconnect that the server cannot finish says to try again"

### Requirement: A file path from the address is checked before any request

The view SHALL request a file and its index only for a path that is in the loaded file list of the
vault. The notes calls SHALL refuse a path with an empty, `.` or `..` segment, also when the dots
are percent-encoded, before they send a request, so that a crafted address cannot reach another
Edge route.

#### Scenario: The path has a dot segment or an empty segment

- **WHEN** a file or index call gets a path such as `../../../../v1/other/route`, `%2E%2E/v1/other/route`, `/Inbox.md` or `Inbox.md/`
- **THEN** the call fails with `notes.file.not_found` and sends no request, verified by `src/features/notes/file-path.test.tsx` "the path %j is refused before any request"

#### Scenario: The address names a file that the vault does not list

- **WHEN** the owner opens `?file=` with a dot segment, an empty segment, or a path that is not in the file list
- **THEN** the view says that the file does not exist in the vault now and sends no file or index request, verified by `src/features/notes/file-path.test.tsx` "the address ?file=%s sends no file request" and "a file that is not in the loaded file list sends no file or index request"
