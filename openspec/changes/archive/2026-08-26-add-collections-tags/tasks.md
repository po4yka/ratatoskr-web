## 1. Fixture curation boundary and optimistic snapshots

- [x] 1.1 Add failing `src/features/collections/curation-source.test.ts` tests
  named `preserves ordered items across add and remove`, `previews a tag merge
  without double-counting`, and `restores the prior snapshot after a rejected
  mutation`; verify they fail because the curation source and controller do
  not exist.
- [x] 1.2 Implement the injectable curation source, deterministic fixture
  projection, pure merge preview, and optimistic snapshot controller; verify
  `npm run test -- src/features/collections/curation-source.test.ts` passes
  without an Edge API request.

## 2. Collection list and detail flows

- [x] 2.1 Add failing `src/features/collections/collections-page.test.tsx`
  harness-flow tests named `creates a collection and opens its detail URL`,
  `renames a collection`, `requires named confirmation before deletion`, and
  `adds and removes ordered items`; verify they fail because the placeholder
  cannot render the flows.
- [x] 2.2 Implement accessible collections list and detail views, including
  create, rename, confirmed delete, ordered item add/remove, pending/empty/
  error states, and the fixture-integration notice; verify `npm run test --
  src/features/collections/collections-page.test.tsx` passes.

## 3. Tags overview and merge review

- [x] 3.1 Add failing `src/features/tags/tags-page.test.tsx` harness-flow tests
  named `shows tag counts and renames a tag`, `previews the records and
  resulting count before merge`, and `rolls back a rejected merge`; verify
  they fail because no tags surface exists.
- [x] 3.2 Implement the accessible tags overview, rename control, distinct
  source/target merge review, confirmed merge, optimistic failure rollback,
  and fixture-integration notice; verify `npm run test --
  src/features/tags/tags-page.test.tsx` passes.

## 4. Search tag filtering and route wiring

- [x] 4.1 Add failing tests in `src/features/search/search-state.test.ts` and
  `src/features/search/search-page.test.tsx` named `restores a tag filter from
  the URL` and `clearing a tag filter removes it from the URL`; verify they
  fail because search state has no tag field or serializer.
- [x] 4.2 Extend the fixture search source, pure search URL state, and search
  controls with source-declared tag filtering; add lazy collection-detail and
  tags routes/navigation and verify the focused search and router tests pass.

## 5. Pending contract boundary and final verification

- [x] 5.1 Add a failing `src/app/capability-route.test.tsx` assertion named
  `does not assign ungenerated collection or tag capabilities` and route tests
  for the new protected fixture routes; verify it fails because the pending
  boundary and routes are not yet represented.
- [x] 5.2 Implement the route and navigation seams required by the test while
  keeping collection/tag capability names out of `KNOWN_CAPABILITIES`; verify
  `npm run test -- src/app/capability-route.test.tsx src/app/router.test.tsx`
  passes and every curation view labels server integration pending.
- [x] 5.3 Record the fixture-only boundary and deferred nested collections,
  smart collections, public links, and collaborators in
  `docs/IMPLEMENTATION_PLAN.md`; this documentation task cannot begin with a
  failing behavioural test because it records an already-observed contract
  gate.
- [x] 5.4 Run `openspec validate add-collections-tags --strict`, the complete
  `DEVELOPMENT.md` gate (with `build-gate` for compiler-backed test/build
  commands), and inspect the final diff; verify every command succeeds and no
  generated contract, guessed capability, or unrelated worktree edit exists.
