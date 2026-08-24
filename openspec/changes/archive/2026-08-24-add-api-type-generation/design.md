## Context

Nothing of the API layer exists yet; this change is IMPLEMENTATION_PLAN item 2 and lands before the typed gateway (item 3). Motivation is in proposal.md - Why; behaviour contracts are in specs/api-type-generation/spec.md.

Constraints that shape the approach:

- The Platform repository publishes `openapi/openapi.json` (OpenAPI 3.1.0, roughly 57 kB, 8 paths, 33 schemas), generated from its route tables and never hand-edited (Platform ADR-0006). This change pins those bytes, it does not fetch anything at build time.
- TypeScript is pinned near 6.0.3 in strict mode with `verbatimModuleSyntax`; the gate list is mirrored between `.github/workflows/ci.yml` and the fenced block in `DEVELOPMENT.md`, with a parity check that fails when the two diverge.
- Repository invariants (AGENTS.md): generated types are committed, regeneration is its own commit, a contract/output mismatch fails the build, no flag bypasses the check, and hand-widening or casting around generated types is forbidden.
- Tests live beside the code as `src/**/*.test.ts(x)` and run under Vitest; the jsdom environment is irrelevant to this change, which is filesystem- and process-level.

## Goals / Non-Goals

**Goals:**

- One command regenerates the module; one command verifies consistency without dirtying the working tree.
- Byte-stable output and lock file (no timestamps), so diffs show real contract changes only.
- The gate catches drift before the test suite runs.
- The generated module typechecks under the strict config but is exempt from lint and formatting churn.

**Non-Goals:**

- Runtime response validation. Whether and how to validate payloads at the boundary is decided together with the gateway in item 3 and recorded there; this change deliberately does not pre-empt it.
- Choosing or generating an HTTP client. No fetch code ships here.
- Version negotiation, deprecation windows, or multi-version support; the development status forbids them outright.
- Automatically refreshing the pinned copy from the Platform repository. A refresh is an explicit, reviewable regeneration commit triggered by a workspace changeset.

## Decisions

**D1. Generator: `openapi-typescript` v7.**
Alternatives: `orval` and `@hey-api/openapi-ts` generate client code and pull runtime dependencies, which pre-empts the fetch-strategy decision belonging to item 3; hand-maintained types violate the no-hand-written-shapes invariant and cannot detect drift at all. `openapi-typescript` emits types only, supports OAS 3.1, produces stable output, and adds zero runtime bytes to the browser bundle.

The package declares `peerDependencies.typescript: "^5.x"` while the repository pins TypeScript near 6.0.3, and upstream publishes no release with a widened range (7.13.0 is latest). Installation uses `--legacy-peer-deps`, accepted after empirical verification: the generator ran deterministically over the pinned document and its output typechecked clean under `tsc --strict` at 6.0.3.

**D2. Pinning layout and lock contents.**
`openapi/openapi.json` holds the exact bytes copied from the Platform repository. `openapi/openapi.lock.json` records three things: the SHA-256 digest of those bytes, the Platform revision the copy came from, and the generator name with version. Alternatives: fetching the document by URL during build (couples the client build to a live server and breaks reproducibility), or recording only the digest (a future reader could not tell why a regenerated golden differs). Timestamps are excluded by design so identical inputs yield identical lock contents.

**D3. Output location and hygiene.**
Output goes to `src/api/generated/schema.ts`, beginning with the generator's DO-NOT-EDIT banner plus a generator/version line. `eslint.config.js` ignores the directory (linting generated code is churn on every regeneration) and `.prettierignore` excludes it (formatting must not rewrite committed bytes). `tsconfig` continues to typecheck the file, which the consumer rot-guard test depends on; the output is type-only declarations, so `verbatimModuleSyntax` poses no problem.

**D4. Scripts.**
`api:gen` regenerates `src/api/generated/schema.ts` in place. `api:check` is a small Node script: it regenerates into a temporary directory created under `os.tmpdir()`, byte-compares the result against the committed file, exits zero or non-zero accordingly, and always removes the temporary directory. Node rather than shell keeps macOS development and ubuntu CI identical. Alternative rejected: regenerate in place and `git diff --exit-code` — that dirties the tree mid-run and races the developer's index.

**D5. Gate position.**
`- run: npm run api:check` is inserted immediately after dependency installation in the ci.yml gate job, and at the same relative position in the DEVELOPMENT.md fenced block. Fail-fast puts the cheapest whole-tree check first, and changing both files in one commit satisfies the parity guard.

**D6. Test pairs (red first, one pair per behaviour):**

| Behaviour | Failing-test task names |
|---|---|
| Lock digest matches pinned bytes | `src/api/contract-pin.test.ts` > "lock file matches the pinned document" > digest equality assertion |
| Lock carries provenance, no timestamps | `src/api/contract-pin.test.ts` > "lock file carries provenance" > field-presence assertions |
| Deterministic regeneration | `src/api/generation.test.ts` > "repeated generation is byte-stable" > double-run byte comparison |
| Check passes on a consistent tree | `src/api/drift.test.ts` > "verification passes when output matches" > exit-code-zero assertion |
| Check fails on modified document | `src/api/drift.test.ts` > "verification fails on drift" > non-zero exit plus untouched-tree assertions |
| Banner guards hand edits | `src/api/generation.test.ts` > "generated module announces itself" > first-line notice assertion |
| Consumers resolve generated types | `src/api/schema-consumer.test.ts` > "imports from the generated module resolve" > named-type import assertion |
| Gate parity holds | `src/api/gate-parity.test.ts` > "workflow and guide list the same verification step" > list-position comparison |

Process-level tests invoke the npm scripts through `child_process.execFile` with the repository root as cwd; file-level tests read the pinned bytes, lock file, and generated module directly.

**D7. Documentation.**
ADR-0005 is written with the repository's required sections (context, options, decision, consequences, security and privacy impact, accessibility impact, contract and compatibility impact, validation, follow-up) and moved from Backlog to Accepted in `docs/adr/README.md`. `README.md` strikes through milestone 2; `IMPLEMENTATION_PLAN.md` checks off item 2.

## Risks / Trade-offs

- [Generator upgrade reshapes the whole output] → the lock records the generator version; upgrades land as deliberate regeneration commits with fully reviewed diffs.
- [Verification cost grows with contract size] → the check is currently sub-second and runs before the suite; revisit only if it ever dominates gate time.
- [Temporary-directory path diverges from in-place generation] → both paths invoke the generator identically; the determinism test exercises the same invocation the check uses.
- [Pinned copy silently lags Platform main] → accepted and made visible: the lock's Platform revision shows staleness in review, and contract movement arrives via workspace changesets that trigger an explicit regeneration.
- [Lint or format fights the generated file] → directory-level eslint and Prettier exclusions remove the fight; typechecking intentionally stays.

## Migration Plan

Single feature branch. Commit order keeps concerns separable: the dependency addition is its own justified commit, pinning plus generated output plus scripts form the behaviour commit, documentation lands last. Rollback is reverting the merge on `main`; nothing runtime-facing changes because types are erased at compile time.

## Open Questions

None. Generator choice, lock shape, and gate position were settled during recon; runtime validation is deferred to item 3 by decision, not left unanswered.
