## 1. Notes vaults (workspace OBS-023 tasks 13.1 and 13.2)

- [x] 1.1 RED: `src/features/notes/connect.test.tsx` "the end-to-end password is asked only after the server-access notice is accepted" asserts that the password field is absent until the notice is accepted. The same commit adds the other tests of `connect.test.tsx` and `browse.test.tsx` that `specs/notes-vault-browsing/spec.md` names. Confirm that they fail because the connect view does not exist.
- [x] 1.2 GREEN: implement the connection list, the connect flow with the notice, the operation progress, and read-only browse with backlinks. Verify 1.1 and the existing route tests, and run the gate list of `DEVELOPMENT.md`.

## 2. The real notes routes (workspace OBS-023 tasks 13.3 to 13.6)

- [x] 2.1 RED: `src/features/notes/connect-operation.test.tsx` "the connect sends no Idempotency-Key and follows the operation that Edge names", "the connect operation names the phase %s", "a failed connect operation names the reason of %s" and "a connect that ends with a warning names the warning" answer the connect with the `202` answer of Edge (`{ operation_id, status, connection }`) and the operation with its `errors` and `warnings`. Confirm that they fail because the connect sends an `Idempotency-Key`, the view shows the raw stage, and the view has no message for the Edge codes, `platform.operation.stale` and `notes.sync.journal_unreadable`.
- [ ] 2.2 GREEN: read the `202` answer of Edge, send no `Idempotency-Key`, name each phase of the connect as a step of four, and show one message for each terminal code and warning of the operation. Verify 2.1 and the tests of `connect.test.tsx`.
