## 1. Contract consumer update

- [x] 1.1 Refresh `openapi/openapi.json`, its lock, and generated schema from the current Platform document; no failing test applies because these are generated artifacts, then verify `npm run api:check`.

## 2. Submission and tracking core

- [x] 2.1 Add `src/features/capture/capture-state.test.ts` tests named `reuses an idempotency key for a transport retry` and `starts a new key for a terminal retry`; run them and confirm their behavioral assertions fail before implementation.
- [x] 2.2 Implement typed URL validation, idempotent capture submission, and terminal retry in `src/features/capture/capture-state.ts`; verify the submission tests pass.
- [x] 2.3 Add `src/features/operations/operation-state.test.ts` tests named `recovers a dropped stream by polling a terminal snapshot once` and `renders fixture stages without local phase mapping`; run them and confirm their assertions fail before implementation.
- [x] 2.4 Implement the snapshot reducer, authenticated SSE adapter, polling recovery, and terminal deduplication in `src/features/operations/`; verify the operation-state tests pass.

## 3. Routes and presentation

- [x] 3.1 Add capture and operation page tests for invalid URL blocking, capability-gated submission, phase rendering, retry semantics, partial warnings, and completion navigation; run them and confirm their assertions fail before implementation.
- [x] 3.2 Implement the lazy capture and operation routes, URL form, truthful loading/error/partial states, and result navigation; verify the capture-page tests pass.
- [x] 3.3 Add `src/features/capture/capture-library.test.tsx` tests named `renders one bounded page of recent captures` and `marks read and favorite as local presentation state`; run them and confirm their assertions fail before implementation.
- [x] 3.4 Implement the bounded capture library projection and local read/favorite presentation toggles; verify the library tests pass.

## 4. Completion

- [x] 4.1 Run targeted capture and operation tests after all implementation changes; verify no duplicate terminal navigation and no paste-text request shape is introduced.
- [x] 4.2 Run the full `DEVELOPMENT.md` gate through `build-gate --` where compiler-backed work is involved, inspect the final diff, and verify `openspec validate add-capture-operation-tracking --strict` passes.
