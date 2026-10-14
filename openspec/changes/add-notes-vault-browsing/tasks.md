## 1. Notes vaults (workspace OBS-023 tasks 13.1 and 13.2)

- [x] 1.1 RED: `src/features/notes/connect.test.tsx` "the end-to-end password is asked only after the server-access notice is accepted" asserts that the password field is absent until the notice is accepted. The same commit adds the other tests of `connect.test.tsx` and `browse.test.tsx` that `specs/notes-vault-browsing/spec.md` names. Confirm that they fail because the connect view does not exist.
- [x] 1.2 GREEN: implement the connection list, the connect flow with the notice, the operation progress, and read-only browse with backlinks. Verify 1.1 and the existing route tests, and run the gate list of `DEVELOPMENT.md`.
