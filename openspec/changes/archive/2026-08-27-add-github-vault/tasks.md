## 1. Capability and fixture boundary

- [x] 1.1 Add failing assertions in `src/components/shell/nav-gating.test.tsx` and `src/app/capability-route.test.tsx` named `hides GitHub and Vault when their capabilities are absent` and `explains a direct GitHub route whose capability is absent`; run those tests and confirm they fail because no GitHub or Vault feature is registered.
- [x] 1.2 Add the fixture-only closed capability names, lazy route seams, navigation entries, and direct-route gates; verify the new absent-capability tests pass and fixture capability names are not added to the generated schema.
- [x] 1.3 Add `src/features/github-vault/github-vault-source.test.ts` tests named `keeps fixture GitHub and vault projections integration-pending` and `preserves supplied mirror snapshots and drill facts`; run them and confirm their behavioral assertions fail before implementing the source.
- [x] 1.4 Implement the bounded contract-fixed fixture source and its read/mutation seams in `src/features/github-vault/github-vault-source.ts`; verify the source tests pass without a gateway request or fabricated Edge type.

## 2. GitHub connection and catalog

- [x] 2.1 Add `src/features/github-vault/github-catalog-page.test.tsx` tests named `rejects an empty PAT before calling the source`, `submits a valid PAT exactly once without echoing it`, and `offers the supplied OAuth PKCE redirect`; run them and confirm each fails for the stated UI behavior before implementation.
- [x] 2.2 Implement the accessible PAT connection form, transient credential clearing, supplied-only OAuth redirect, integration-pending notice, and loading, empty, error, offline, and unauthorized catalog states; verify the connection tests pass and no browser storage or direct provider request is introduced.
- [x] 2.3 Add a failing catalog/detail test named `renders supplied repository state and does not synthesize absent analysis`; run it and confirm the assertion fails before implementing the repository projections.
- [x] 2.4 Implement bounded repository list/detail rendering for supplied metadata, star/tracked/ignored state, optional analysis, and its explained no-analysis state; verify the catalog/detail test passes.

## 3. Consent-gated catalog writes

- [x] 3.1 Add failing component tests named `does not change repository state when confirmation is cancelled` and `changes the named repository only after confirmation`; run them and confirm the source mutation assertions fail before implementation.
- [x] 3.2 Implement named track/untrack and star/unstar confirmation dialogs using the established alert-dialog composition, with pending/error feedback and rollback on source failure; verify both confirmation tests pass and the confirm action is never default focus.

## 4. Git Vault evidence

- [x] 4.1 Add `src/features/github-vault/git-vault-page.test.tsx` tests named `renders mirror health and supplied manifest digests` and `renders passed and failed restore drill evidence without inferring verification`; run them and confirm their rendering assertions fail before implementation.
- [x] 4.2 Implement the capability-gated vault route with mirror-health list, per-mirror snapshots, manifest digests, restore-drill pass/fail timestamps and timings, plus loading, empty, partial, error, offline, and unauthorized states; verify the vault evidence tests pass and a failure fixture never renders a verified label.

## 5. Completion and integration boundary

- [x] 5.1 Update `docs/IMPLEMENTATION_PLAN.md` to mark item 9 fixture-backed and integration-pending, and record star-list management depth and watch configuration as follow-ups; verification is an inspected documentation diff because this is documentation only.
- [x] 5.2 Run all new focused tests, `npm run api:check`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, `build-gate -- npm run build`, and `npm run audit:ui -- --fail-under 79`; inspect the final diff and verify `openspec validate add-github-vault --strict` passes.
