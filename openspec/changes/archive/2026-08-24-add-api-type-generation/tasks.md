## 1. Groundwork

- [x] 1.1 Add `openapi-typescript@^7` as a devDependency in its own commit. Configuration task: no failing test can precede installing a devDependency; verify with `npm ls openapi-typescript` printing a resolved 7.x version.
- [x] 1.2 Pin the Platform contract: copy `/Users/po4yka/GitRep/ratatoskr-workspace/repos/platform/openapi/openapi.json` byte-exact to `openapi/openapi.json` and record the Platform repository's current commit SHA for the lock. Data artifact, nothing behavioural yet; verify `cmp <source> openapi/openapi.json` reports no difference and `jq -r .openapi openapi/openapi.json` prints `3.1.0`.

## 2. Pinned-contract integrity

- [x] 2.1 Add the failing tests in `src/api/contract-pin.test.ts`: "lock file matches the pinned document" asserts the computed SHA-256 of `openapi/openapi.json` equals `digest` in `openapi/openapi.lock.json`; "lock file carries provenance" parses the lock and asserts `platformCommit`, `generator.name`, and `generator.version` exist and no key matches a timestamp pattern. Expected failure: both fail because `openapi/openapi.lock.json` does not exist yet. Run `npm run test -- src/api/contract-pin.test.ts` and confirm exactly those failures.
- [x] 2.2 Write `openapi/openapi.lock.json` recording the SHA-256 digest of the pinned bytes, the Platform commit the copy came from, and `generator: {name: "openapi-typescript", version: "<installed>"}`. Verify: the same test command now exits green.

## 3. Generated module

- [x] 3.1 Add the failing checks. In `src/api/generation.test.ts`: "repeated generation is byte-stable" invokes the generator twice into temporary files with the same arguments `api:gen` will use and asserts both outputs are byte-identical to `src/api/generated/schema.ts`; "generated module announces itself" reads the head of `src/api/generated/schema.ts` and asserts a do-not-edit notice naming the generator. Beside them add `src/api/schema-consumer.ts` importing named types from `@/api/generated/schema` and `src/api/schema-consumer.test.ts` "imports from the generated module resolve". Expected failure: the vitest cases fail because `api:gen` and the generated module do not exist yet; the consumer pair fails through `npm run typecheck` exiting non-zero with an unresolved `@/api/generated/schema` import (a type-only import is invisible to vitest, so typecheck is the honest verifier). Run both and confirm the stated failures.
- [x] 3.2 Add the `api:gen` script, generate `src/api/generated/schema.ts`, and exclude `src/api/generated/` in `eslint.config.js` and `.prettierignore`. Verify: `npm run typecheck` exits zero and `npm run test -- src/api/generation.test.ts src/api/schema-consumer.test.ts` is green.

## 4. Drift verification

- [x] 4.1 Add the failing tests in `src/api/drift.test.ts`: "verification passes when output matches" spawns `npm run api:check` expecting exit code zero and no tracked file modified afterwards; "verification fails on drift" appends one byte to `openapi/openapi.json`, expects a non-zero exit whose output names the disagreeing artifacts, restores the file, and asserts the working tree stayed clean throughout. Expected failure: both fail because `api:check` does not exist yet. Confirm with `npm run test -- src/api/drift.test.ts`.
- [x] 4.2 Implement `scripts/check-api.mjs`: regenerate into a temporary directory under `os.tmpdir()`, byte-compare against the committed module, exit zero or non-zero accordingly, always remove the temporary directory, never write inside `src/`; wire it as the `api:check` script. Verify: `npm run test -- src/api/drift.test.ts` is green and `git status --porcelain` is empty immediately after a passing run.

## 5. Gate parity

- [x] 5.1 Add the failing test `src/api/gate-parity.test.ts` "workflow and guide list the same verification step": extract the `- run:` list from the ci.yml gate job and the `npm` lines from the fenced block under `### The gate` in `DEVELOPMENT.md`, then assert both contain `npm run api:check` at the same relative position. Expected failure: neither side contains the step yet.
- [x] 5.2 Insert `- run: npm run api:check` immediately after dependency installation in the ci.yml gate job and at the same position in the `DEVELOPMENT.md` fenced block. Verify: the parity test goes green.

## 6. Documentation and closure

These tasks cannot start from a failing test: they are prose documents, validation commands, and repository workflow, not behaviour.

- [x] 6.1 Write `docs/adr/0005-<short-title>.md` with the repository's required sections (context, options, decision, consequences, security and privacy impact, accessibility impact, contract and compatibility impact, validation, follow-up) and move its index entry from Backlog to Accepted in `docs/adr/README.md`. Verify by reading the rendered index entry.
- [x] 6.2 Strike through README milestone 2 and check off IMPLEMENTATION_PLAN item 2. Verify both documents show the completed state.
- [x] 6.3 Stage conventional commits per concern: the devDependency addition alone, the pinned contract plus generated module plus scripts plus tests together, the gate parity edit, documentation last. Verify `git log --oneline` shows the separation.
- [x] 6.4 Run the full gate: `npm run typecheck`, `lint`, `format:check`, `test`, `build`, `audit:ui -- --fail-under 69`, plus `npm audit --omit=dev --audit-level=high`. Verify every exit code is zero.
- [ ] 6.5 Validate and archive: `openspec validate --change add-api-type-generation --strict`, then archive the change, confirming the delta lands in `openspec/specs/api-type-generation/spec.md` and `openspec validate --archived` stays clean.
- [ ] 6.6 Integrate: merge the branch into `main`, push `origin main`, delete the worktree and the feature branch. Verify `git worktree list` no longer lists it and the remote tip advanced.
