## Context

Workspace change `add-notes-vault-connections` defines the routes. `docs/NOTES_AND_SITES.md`
section 7 of the workspace lists `POST /v1/notes/connections` (202 with an operation) and
`DELETE /v1/notes/connections/{id}` (204). Its design D4 says that the connect body carries the
Obsidian password, the MFA code and the end-to-end password, and D10 says that the operation kind is
`notes.connection.connect` with the phases `login`, `setup`, `first_sync` and `indexing`. Its risk
list says that the connect flow states that the server can read the whole vault before it asks for
the end-to-end password. `ratatoskr-notes` serves the read routes of its group 7
(`services/notes/src/api/read.rs`), and the shapes in D1 are read from those handlers.

## Decisions

### D1. One module holds the notes wire shapes

The pinned Edge contract has no `/v1/notes` route. `notes-source.ts` holds the request and response
shapes and the calls through the gateway. It is the only file that a later regeneration commit must
change. The shapes:

- `GET /v1/notes/connections` answers `{ connections: [{ connection_id, channel,
  vault_display_name, state, excluded_folders, conditions: [{ code, paths }] }] }`. The state is
  `connecting`, `active` or `login_expired`.
- `POST /v1/notes/connections` takes `{ channel: "sync", vault_key, vault_display_name,
  sync_login: { email, password, mfa_code?, e2e_password? } }`, the body that
  `ratatoskr-notes` reads (`services/notes/src/api.rs`, `ConnectRequest`, `deny_unknown_fields`).
  Edge answers `202` with `{ operation_id, status: "accepted", connection }`, and `connection` is
  the answer of `ratatoskr-notes` unchanged: `{ connection_id, channel, state, operation: {
  operation_id, kind, lane } }` (Platform `crates/public-api/src/notes.rs`). The request carries no
  `Idempotency-Key`: Edge takes none, because its ledger would keep a digest of the body.
- `DELETE /v1/notes/connections/{id}` answers `204`.
- `GET /v1/notes/connections/{id}/files` answers `{ files: [{ file_id, path, revision,
  media_type, length_bytes }] }`. It has no cursor.
- `GET /v1/notes/connections/{id}/files/{*path}` answers the bytes of the current revision, or of
  `?revision=<sha256>`. The view reads them through the gateway stream and decodes them as UTF-8.
  Bytes that are not UTF-8 are named as not text.
- `GET /v1/notes/connections/{id}/index/{*path}` answers `{ path, revision, index, links: [{ link,
  embed, target }], backlinks: [{ path, count }] }`. `index` is `null` for a file that is not a
  Markdown note, and otherwise holds `frontmatter` and `tags` among other members. The view shows
  the links, the tags, the frontmatter as properties, and the backlinks.
- `PUT /v1/notes/connections/{id}/excluded-folders` sets the folders that are not indexed. The view
  has no place for it yet, so it does not call it.

The routes match a file path with `{*path}`, so the path is sent as path segments, each encoded with
`encodeURIComponent`. That function keeps `.` and `..`, and fetch removes dot segments, so a path
from `?file=` could reach another Edge route. The notes calls refuse a path with an empty, `.` or
`..` segment, also with percent-encoded dots, before any request, and the view requests a file only
when the loaded file list holds its path.

### D2. The capability name is `notes.vaults`

The route and the navigation entry require `notes.vaults`. Platform must publish this name in the
capability document. Until it does, the route shows the explained absence.

### D3. Secrets are form state for one submit

The password, the MFA code and the end-to-end password live only in React state. The submit sends
them once in the request body. The form clears them when the request ends, with any result. They
never enter a URL, browser storage, a log call, or an error message.

### D4. The notice comes before the end-to-end password

The end-to-end password field is not in the document until the owner accepts the notice. The submit
refuses a form whose notice is not accepted.

### D5. Progress uses the public operation API

The connect answer carries the operation id. The view reads `/v1/operations/{id}`, follows
`/v1/operations/{id}/events` when the gateway can stream, and polls when it cannot, and says so. The
stage is shown as text and the view branches only on the status. The view names the four phases of a
`sync` connect, `login`, `setup`, `first_sync` and `indexing`, as steps of four, and shows any other
stage as its own text. A terminal snapshot shows one message for each code in `errors` and
`warnings`: the codes of `ratatoskr-notes`, the `edge.upstream_*` codes of a forward that failed, and
`platform.operation.stale` of the stale-operation reaper. A code without a message shows the server
text of its envelope.

## Risks / Trade-offs

- [Shapes copied from the handlers] → The tests mock the shapes in D1. A change in a notes handler
  that does not change the fixtures goes unseen until a contract brings the routes.
- [Hand-written wire types] → `AGENTS.md` asks for generated types. The pinned contract has none
  for `/v1/notes`, so one module holds them until a contract change brings the routes.
