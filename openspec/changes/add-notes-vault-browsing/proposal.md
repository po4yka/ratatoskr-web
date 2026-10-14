## Why

The owner keeps notes in Obsidian, and the web client cannot show them. Workspace change
`add-notes-vault-connections` (OBS-023) adds `ratatoskr-notes` and the Edge routes under
`/v1/notes`. Its tasks 13.1 and 13.2 give this client the surface: the connection list, the connect
flow for Obsidian Sync with the server-access notice, the progress of the connect operation, and a
read-only browse of the files with their backlinks.

## What Changes

- Add the capability-gated route `/notes` and `/notes/:connectionId`, and its navigation entry.
- Add the connect form for the `sync` channel. It shows the server-access notice and asks for the
  end-to-end encryption password only after the owner accepts the notice. It sends the typed
  secrets once, in the request body, and keeps them nowhere after the submit.
- Show the `notes.connection.connect` operation through the public operation API, with a stream
  first and polling as the visible fallback.
- Show the stable notes error codes as specific messages.
- Add a read-only browse: the file list of a connection, the text of one file, and its backlinks.
- Add disconnect with a confirmation that names the vault.

## Capabilities

### New Capabilities

- `notes-vault-browsing`: the web surface for Obsidian vault connections and read-only browse.

### Modified Capabilities

- None.

## Impact

- Affects the feature registry, the lazy router, the capability vocabulary, and a new feature
  module `src/features/notes/`.
- Adds no dependency. Does not change the pinned API artifact: the pinned Edge contract has no
  `/v1/notes` route yet. The request and response shapes live in one module,
  `src/features/notes/notes-source.ts`, and follow the workspace documents and the
  `ratatoskr-notes` source. When Platform publishes the routes in the contract, a regeneration
  commit replaces them with generated types.
- The workspace store owns the shared behaviour: `notes-vault-connections` and `notes-file-index`
  in change `add-notes-vault-connections`.
