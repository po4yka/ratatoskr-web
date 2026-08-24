# ADR-0005: API type generation from the pinned contract and drift enforcement

> Status: Accepted  
> Date: 2026-08-24

## Context

The client compiles against the shape of the Edge API. Nothing guarantees that shape except the OpenAPI document `ratatoskr-platform` publishes, and nothing enforces it: a field renamed behind this repository's back surfaces as a runtime surprise in a user's session, not as a build failure. Repository rules already mandate the outcome — generated types, never hand-written request or response shapes; a mismatch between the pinned contract and the generated file fails the build; an observed API response is not a contract. What did not exist was the mechanism.

The platform repository publishes its contract as `openapi/openapi.json`. Consuming it here had to keep three properties: the bytes the types came from are identified, generation is reproducible offline, and drift between the pinned bytes and the generated output is loud.

## Options

Hand-written interfaces maintained manually were rejected outright. Every field rename lands as `undefined` at runtime, the provenance of the shape is unknowable, and the rule forbids it anyway.

Generating at build time from a running Platform, or straight from the sibling repository, was rejected. Builds become dependent on something running or on a checkout layout this client does not own; regeneration is unreviewable because nothing is committed; two builds of the same commit can produce different trees.

Pinning the document by digest in this repository and committing the generated output, with a checker that fails the gate on drift, was chosen. The pinned copy makes builds hermetic and the contract change reviewable; the committed module lets the client compile with no network and no sibling checkout; the checker turns silent drift into an exit code.

## Decision

The contract is vendored byte-exact as `openapi/openapi.json`, copied from the platform repository at commit `560dd3a278354a0998fb07279c31d71746c7b9f2`. Its SHA-256 digest is recorded beside it in `openapi/openapi.lock.json`, together with the generator identity (`openapi-typescript` 7.13.0). Types are generated into `src/api/generated/schema.ts` by the `api:gen` script and committed.

Drift enforcement is `scripts/check-api.mjs`, wired as `api:check`, and it verifies two layers. Layer one recomputes the digest of the pinned document against the lock and names both files on disagreement. Layer two regenerates into a temporary directory under `os.tmpdir()` and byte-compares the result against the committed module. The checker writes nothing inside `src/` and removes its temporary directory on every path out. The gate runs it immediately after `npm ci` in `.github/workflows/ci.yml`, and `DEVELOPMENT.md` carries the same step in its gate block; a parity guard fails whichever file lists the two differently.

`src/api/generated/` is excluded from ESLint and Prettier. It is generator output; an edit there is overwritten by the next regeneration, and the exclusion makes that policy mechanical instead of remembered.

One deliberate extension beyond the original task wording: the digest layer comes first because appending a single trailing newline to the pinned document regenerates to byte-identical output. A compare-only check would pass while the lock no longer described the bytes on disk. On failure both artifacts are named, because the disagreement has two sides and the operator has to learn which one moved.

## Consequences

- A contract change arrives as a regeneration commit: refresh the pinned copy, rerun `api:gen`, let the lock record the new digest, and the diff shows exactly which shapes moved.
- The generated module is types-only, so it costs nothing at runtime; `openapi-typescript` rides as a devDependency and ships nowhere near a bundle.
- Bumping the generator belongs to a regeneration commit, not a routine dependency bump; the lock records which version produced the module.
- The checker re-runs generation on every gate pass, costing a few seconds. Accepted in exchange for the guarantee being measured rather than assumed.

## Security and privacy impact

Generation is offline: the checker reads local files and fetches nothing, so no third-party request enters the build. The digest pins content rather than a location, so a moved or tampered upstream document cannot silently change what this client compiles against, and `platformCommit` records where the bytes came from. The generated module carries neither secrets nor user content.

## Accessibility impact

No user-visible surface. Indirectly the enforcement serves truthful failure: a shape mismatch never reaches a user, because it stops the build before anything ships that would render a broken state a screen reader would have to untangle.

## Contract and compatibility impact

This is the client-side half of the workspace contract flow. Contract changes travel as ratatoskr-workspace changesets, the client follows with a regeneration commit, and the client rolls out last and rolls back first. The lock's `platformCommit` ties the generated types to an exact backend state, so an older client against a newer backend stays governed by the existing cross-repository rules. No version negotiation, parallel major, or deprecation window is introduced — the development-status rules hold.

## Validation

Five suites cover the mechanism, each red before its implementation: `contract-pin.test.ts` (computed digest equals the lock, provenance keys present, none timestamp-shaped), `generation.test.ts` (double generation is byte-stable; the header notice names the generator), `schema-consumer.test.ts` with `npm run typecheck` (imports from the generated module resolve), `drift.test.ts` (a pass leaves the tree untouched; one appended byte fails with both artifacts named and the tree restored), and `gate-parity.test.ts` beside the awk guard in `ci.yml` (workflow and guide list the same steps in the same position). The full gate ran green before this change was archived.

## Follow-up

The typed fetch gateway, the next slice, consumes these generated path and component types, and query keys derive from them. When the workspace harness lands, wire its `ws drift` view to the same digest so a contract change is visible across repositories before any client regenerates. Regeneration cadence follows platform commits through workspace changesets; it is not scheduled.
