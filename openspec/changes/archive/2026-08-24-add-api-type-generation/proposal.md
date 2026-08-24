## Why

The client has no typed view of the Platform Edge API, so every future call site would hand-write request and response shapes and nothing would notice when the Platform contract moves underneath them. Pinning the contract and generating types from it closes that gap and is plan item 2 in `docs/IMPLEMENTATION_PLAN.md`; it is the prerequisite for the typed fetch gateway (item 3).

## What Changes

- Pin the exact bytes of the Platform OpenAPI document at `openapi/openapi.json`, with a lock file recording the source SHA-256 digest, the Platform commit the copy came from, and the generator identity. The lock file deliberately records no timestamps so regeneration stays reproducible.
- Add `openapi-typescript` as a devDependency plus two scripts: `api:gen` regenerates `src/api/generated/schema.ts` from the pinned document, and `api:check` regenerates without writing to the working tree and fails when the result differs from the committed file.
- The generated module carries a DO-NOT-EDIT banner and is excluded from ESLint and Prettier. It contains types only, so it contributes nothing to the browser bundle.
- The CI gate gains an `npm run api:check` step, mirrored in the fenced command block in `DEVELOPMENT.md`; the parity check requires both files to change together.
- Record the outcome: ADR-0005 written and accepted, README milestone 2 struck through, IMPLEMENTATION_PLAN item 2 checked off.

Out of scope: the fetch gateway itself (plan item 3), runtime response validation, any UI.

## Capabilities

### New Capabilities

- `api-type-generation`: The repository pins the Platform OpenAPI document by content digest, generates TypeScript types from it deterministically, and fails the build when the pinned document and the generated output drift apart.

### Modified Capabilities

None. `openspec/specs/` is intentionally empty today; this change introduces the repository's first local capability.

## Impact

- `package.json`: one devDependency (`openapi-typescript`) and two scripts. No runtime dependency reaches the browser; the generated module is erased at compile time.
- `.github/workflows/ci.yml` and `DEVELOPMENT.md`: one new gate step each, kept in parity by the existing check.
- `eslint.config.js` and `.prettierignore`: ignores for the generated directory.
- New files: `openapi/openapi.json` (pinned copy), the lock file beside it, and `src/api/generated/schema.ts`.
- Documentation: a new `docs/adr/0005-*` record with its index entry moved from Backlog to Accepted, plus updates to `README.md` and `docs/IMPLEMENTATION_PLAN.md`.
