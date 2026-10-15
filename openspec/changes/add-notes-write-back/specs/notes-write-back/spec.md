## Purpose

Give the owner the surface that changes a connected vault: an editor for a text note, the
write-back switch of a connection, and a view that resolves a conflict. The shared behaviour lives
in the workspace store, spec `notes-write-command` of change `add-notes-write-back`.

## ADDED Requirements

### Requirement: A save uploads first and names the loaded revision

The editor SHALL upload the content of a save on the blob route of the connection before it sends
the write. The write SHALL be one `update` that names the SHA-256 of the loaded bytes as
`base_hash`, the `BlobRef` that the upload answered, and an `Idempotency-Key`.

#### Scenario: The owner saves an edited note

- **WHEN** the owner edits a loaded note and saves it
- **THEN** the upload is opened, sent and finalized before the write, and the write names the hash of the loaded bytes, verified by `src/features/notes/editor.test.tsx` "uploads before it writes and sends the loaded base hash"

### Requirement: The base moves only when a write succeeds

The content of a write SHALL become the base of the next save only when the write operation
succeeds.

#### Scenario: A write fails and the owner saves again

- **WHEN** a write fails and the owner saves again, and then a write succeeds and the owner saves again
- **THEN** the second save names the loaded revision and the third names the content of the second, verified by `src/features/notes/write-retry.test.tsx` "the base becomes the written content only when the write succeeds"

### Requirement: One save runs at a time

The editor SHALL keep Save disabled from the save until its write operation ends, so that a second
save never names a base that the first write replaces.

#### Scenario: The owner saves while a write runs

- **WHEN** a write operation of the editor runs, and then succeeds
- **THEN** Save is disabled while it runs and enabled after it succeeds, verified by `src/features/notes/editor.test.tsx` "save stays disabled while the write operation runs"

### Requirement: The end of an operation is reported once

The progress of a write SHALL report the end of its operation to the view once per operation, also
when the view renders again.

#### Scenario: The view renders again after a success

- **WHEN** the progress of a succeeded write renders three times
- **THEN** its success callback runs once, verified by `src/features/notes/write-progress.test.tsx` "runs onSucceeded once for a succeeded operation, also after renders"

### Requirement: A request sent again keeps its key

A save, a resolution and a write-mode change SHALL keep their `Idempotency-Key` while no answer
accepted them and their content, choice or mode does not change. Another content, choice or mode
SHALL get a new key.

#### Scenario: A save gets no answer

- **WHEN** a save gets no answer and the owner saves the same content again, then other content
- **THEN** the second write has the key of the first and the third has a new key, verified by `src/features/notes/write-retry.test.tsx` "a save without an answer is sent again with the same key, and new content with a new key"

#### Scenario: A write-mode change gets no answer

- **WHEN** a write-mode change gets no answer and the owner sends it again, then the other mode
- **THEN** the second change has the key of the first and the third has a new key, verified by `src/features/notes/write-retry.test.tsx` "a write-mode change without an answer is sent again with the same key"

#### Scenario: A resolution gets no answer

- **WHEN** a resolution gets no answer and the owner sends it again, then another choice
- **THEN** the second resolution has the key of the first and the third has a new key, verified by `src/features/notes/write-retry.test.tsx` "a resolution without an answer is sent again with the same key"

### Requirement: The owner switches write-back

The browse view of a connection SHALL offer to turn write-back on and off. A change SHALL send
`PUT /v1/notes/connections/{id}/write-mode` with the mode and an `Idempotency-Key`.

#### Scenario: The owner turns write-back on

- **WHEN** the owner selects "Turn write-back on"
- **THEN** the client sends `PUT .../write-mode` with `{"write_mode":"on"}` and a key, verified by `src/features/notes/editor.test.tsx` "write-mode switch sends PUT write-mode"

### Requirement: The conflict view offers only the choices that notes accepts

The conflict view SHALL offer `accept_merge` only for a conflict with a merge proposal, and SHALL
name a side whose text is over the limit as too large to show.

#### Scenario: A conflict without a proposal

- **WHEN** the owner opens a conflict with a merge proposal, and then one without
- **THEN** the first offers "Accept the merge proposal" and the second does not, verified by `src/features/notes/conflict-view.test.tsx` "offers accept_merge only with a proposal"

#### Scenario: A side over the limit

- **WHEN** the owner opens a conflict whose current and writer texts are over the limit
- **THEN** both sides say that the text is too large to show, and the view offers custom content, verified by `src/features/notes/conflict-view.test.tsx` "says that a side over the limit is too large to show"
