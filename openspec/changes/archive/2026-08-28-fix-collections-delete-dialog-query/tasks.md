## 1. Reproduce the failure

- [x] 1.1 Observe the failing gate before the change. This is a test defect rather than a product defect, so the existing test is the failing test rather than a new one: `ci` run 32992649392 on `f0baf7a1` reports `TestingLibraryElementError: Unable to find an accessible element with the role "alertdialog"` at `collections-page.test.tsx:68:19`. The same suite passes on a developer machine, which is the evidence that the query depends on the environment rather than on the component.

## 2. Query the dialog for what it is

- [x] 2.1 Replace the synchronous `getByRole` for the dialog and for its named confirm button with `findByRole`, matching the idiom `src/features/signout/sign-out.test.tsx` already uses for the same dialog. Assert nothing new and remove no assertion.

## 3. Verify the repair

- [x] 3.1 Confirm the assertion still fails when it should: change the expected dialog copy to a string present nowhere, observe `1 failed | 3 passed`, restore it.
- [x] 3.2 Run the documented gate: `npm run api:check`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test` (40 files, 157 tests), `npm run build`. All pass.
- [x] 3.3 Observe the hosted `ci` workflow pass on the integrated commit: run 32995983078 on `3ad0b347`, conclusion `success`.
