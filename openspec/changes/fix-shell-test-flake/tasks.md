## 1. Reproduce the flake

- [x] 1.1 This is a test defect, so the existing test is the failing test rather than a new one. Confirm all three `ci` failures share one cause: runs 33042070571, 33047091729 and 33092164295 each report `Unable to find role="menuitem" and name /sign out/i` in `shell.test.tsx > the shell surface > reaches sign-out from the keyboard and confirms before revoking`, and every other run in the window is green.
- [x] 1.2 Reproduce locally: under induced CPU contention the pre-change file failed one run in eight with the same error, and a full-suite run reproduced it without induced load.

## 2. Establish the cause rather than assuming it

- [x] 2.1 Probe whether the menu opens at all. A probe firing keyboard events alone never finds the menu item; a probe firing the click finds it every time. The interaction is correct and the test's synthetic click is required — the failure is wall-clock, measured at 1076ms against a 1000ms window.
- [x] 2.2 Confirm the cost is the test's own work and not competition between files: `vite.config.ts` sets `fileParallelism: false`.

## 3. Remove the work the tests do not need

- [x] 3.1 Inject an already-resolved module for the `collections` route in the deep-link test and for `search` in `renderAuthenticatedShell`, through `RouterSeams.routeModules`, matching the idiom in `lazy-route.test.tsx`.
- [x] 3.2 Measure: ten passes in ten under the induced contention that previously failed one in eight, and eight clean full-suite runs — but one full-suite failure still observed with the stubs alone, so this is necessary and not sufficient.

## 4. Give the remaining wall-clock a window that fits the runner

- [x] 4.1 Raise `asyncUtilTimeout` to 5000ms in `src/test/setup.ts` and `testTimeout` to 10000ms in `vite.config.ts`.
- [x] 4.2 Confirm the assertion still has teeth: point the query at a menu item that exists nowhere and observe it still fail, after roughly 5.4s rather than roughly 1s.

## 5. Verify

- [x] 5.1 Run the documented gate: `api:check`, `typecheck`, `lint`, `format:check`, `test` (63 files, 229 tests), `build`. All pass.
- [ ] 5.2 Observe the hosted `ci` workflow pass on the integrated commit, and watch the next several runs for a recurrence.
