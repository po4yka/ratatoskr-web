## Context

The workspace change `add-notes-write-back` defines the routes, and Platform and notes implement
them (`crates/public-api/src/notes_writes.rs`, `services/notes/src/api/blobs.rs` and
`services/notes/src/api/conflicts.rs`). A write, a resolution and a write-mode change answer `202`
with `{ operation_id, status: "accepted" }` and require an `Idempotency-Key` of 1 to 255 characters.
Write content is uploaded first with the shared chunked transfer contract.

## Decisions

### D1. The base is the hash of the loaded bytes

The editor names as `base_hash` the SHA-256 of the bytes that it loaded, not a revision from the
file list, which can be older than the bytes. The content of a write becomes the base of the next
save only when its operation succeeds, so a failed write never leaves a base that the vault does
not hold. Two saves before the first succeeds give a conflict against the first; that is safe.

### D2. One key per logical request

A key stays the same while the subject stays the same and no answer accepted the request. The
subject of a save is the path, the base and the content hash; of a resolution the conflict, the
choice and the custom content hash; of a write-mode change the connection and the mode. A request
sent again after a lost answer is then a replay at Edge, and never a second operation.

### D3. The conflict view shows what notes sends, and why something is absent

A side in `texts_over_limit` is too large to show. `accept_merge` is offered only with a
`merge_proposal`; `custom` only for `text/markdown` and `text/plain`. A text conflict without a
proposal says that the server can still be making it.

## Risks / Trade-offs

- Notes does not report the write mode of a connection. The switch shows the result of the last
  change only.
- The editor sends only `update`. Create, rename, move, delete and `set_property` have no control
  yet.
