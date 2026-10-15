## Why

Workspace change `add-notes-write-back` (OBS-024) lets Ratatoskr change a connected Obsidian vault.
Its group 13 gives this client the surface: an editor for a note, the write-back switch of a
connection, and a view that resolves a conflict. Before it, this client only browsed a vault.

## What Changes

- Add an editor to the file panel of a text note. A save uploads the content first and then sends
  one `update` whose base is the revision that the editor loaded.
- Add the write-back switch of a connection to the browse view.
- Add the route `/notes/conflicts/:conflictId`: the sides of a conflict as text, and the choices
  that notes accepts for it.
- Keep one `Idempotency-Key` per logical write, resolution and write-mode change, so that a request
  sent again after a lost answer is a replay.
- The gateway sends a bytes body unchanged, for the chunks of an upload.

## Capabilities

### New Capabilities

- `notes-write-back`: the web surface that writes a note, switches write-back and resolves a
  conflict.

### Modified Capabilities

- None. `notes-vault-browsing` of change `add-notes-vault-browsing` is not archived; its browse
  requirement now states that a file has no editable field until the owner opens the editor.

## Impact

- Affects `src/features/notes/`, the route list in `src/app/router.tsx` and the gateway
  (`GatewayRequest.bytes`).
- Adds no dependency. The pinned Edge contract has no `/v1/notes` route, so the write shapes live
  in `src/features/notes/notes-write.ts`, as the read shapes live in `notes-source.ts`.
- The workspace store owns the shared behaviour: spec `notes-write-command` of change
  `add-notes-write-back`.
