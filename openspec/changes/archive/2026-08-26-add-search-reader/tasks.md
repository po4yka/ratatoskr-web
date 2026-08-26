## 1. Fixture boundary and search state

- [x] 1.1 Add `src/features/search/search-state.test.ts` with failing tests
  named `restores query, available mode, and page from URL` and `resets page
  when query or mode changes`; verify each fails because the state module does
  not exist.
- [x] 1.2 Implement the fixture-only archive source and pure search URL state
  module in `src/features/search/`; verify `npm run test --
  src/features/search/search-state.test.ts` passes without calling an
  undeclared Edge API path.
- [x] 1.3 Add `src/features/search/snippet.test.tsx` with failing tests named
  `highlights every literal case-insensitive match` and `treats regular
  expression characters as text`; verify each fails because snippet rendering
  does not exist.
- [x] 1.4 Implement escaped snippet segmentation and result-row match
  explanations; verify `npm run test -- src/features/search/snippet.test.tsx`
  passes.

## 2. Search surface and route integration

- [x] 2.1 Add failing component/integration tests in
  `src/features/search/search-page.test.tsx` for query/mode/pagination URL
  synchronization plus loading, empty, and retryable error states; verify the
  tests fail because the placeholder cannot render them.
- [x] 2.2 Replace the search placeholder with the accessible fixture-backed
  search view and wire it through the existing protected route; verify `npm
  run test -- src/features/search/search-page.test.tsx` passes and no fixture
  test performs a network request.
- [x] 2.3 Add a failing router test in `src/app/router.test.tsx` proving a
  result opens its document reader route; verify it fails because the reader
  route is absent.
- [x] 2.4 Add the lazy document reader route and keep the existing capability
  boundary intact; verify `npm run test -- src/app/router.test.tsx` passes.

## 3. Reader evidence and local state

- [x] 3.1 Add failing `src/features/reader/reader-page.test.tsx` tests named
  `renders provenance, extraction warnings, and available analysis` and
  `reports absent analysis without inventing it`; verify they fail because no
  reader view exists.
- [x] 3.2 Implement typed Document IR fixture projection, safe block rendering,
  provenance/warning header, TLDR/key points, tags, and reader empty/error
  states; verify `npm run test -- src/features/reader/reader-page.test.tsx`
  passes.
- [x] 3.3 Add failing `src/features/reader/reader-preferences.test.ts` tests
  named `restores valid persisted reading settings` and `rejects invalid local
  values`; verify they fail because the preference module does not exist.
- [x] 3.4 Implement allowlisted, namespaced reader settings persistence and
  settings popover controls; verify `npm run test --
  src/features/reader/reader-preferences.test.ts` passes.
- [x] 3.5 Add a failing `src/features/reader/reader-progress.test.ts` test
  named `resumes using current scrollable-distance ratio`; verify it fails
  because no progress calculation exists.
- [x] 3.6 Implement clamped document-scoped progress storage, visible progress,
  resume behavior, and fixture-local mark-read/favorite action state; verify
  `npm run test -- src/features/reader/reader-progress.test.ts` passes.

## 4. Documentation and verification

- [x] 4.1 Record the fixture-only integration boundary, pending Knowledge
  contract/deployment dependency, and explicitly deferred parity items in the
  change artifacts; verify `rg -n "pending|highlights|TTS" openspec/changes/add-search-reader`
  finds all three records. This planning/documentation task cannot begin with a
  failing behavioural test.
- [x] 4.2 Run `openspec validate add-search-reader --strict`, all repository
  gate commands from `DEVELOPMENT.md`, and inspect the final diff; verify each
  command succeeds and the change contains no generated contract or unrelated
  worktree edits.
