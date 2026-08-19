# Developing Ratatoskr Web

> Status: Proposed  
> Last reviewed: 2026-08-19

Architecture bootstrap: no application, framework choice, build tool, router, API client, design
system integration, test runner, or CI exists.

## Intended toolchain

TypeScript, a modern browser build tool, a client router, a server-state cache, a design system
consumed as a dependency rather than re-implemented, types generated from the pinned Platform API
contract, component and end-to-end browser tests, lint and typecheck, and a deterministic production
build.

## Workflow

1. Decide framework, build tool, and design-system dependency in an ADR before the lockfile.
2. Build the fetch gateway, refresh, and error normalization once, before the second view.
3. Generate API types from the pinned contract; a drift fails the build.
4. Add `.github/workflows/ci.yml` in the same commit as the first manifest. `fleet.yml` fails closed
   otherwise, deliberately.
5. Build loading, empty, error, partial, and unauthorized states with every view, not after it.
6. Test against a local mock Platform or the workspace Compose profile, never a live deployment.

The first scaffold PR must document exact install, generate, typecheck, lint, test, build, and dev
commands. No provider token, real archive fixture, or production endpoint is ever required to run
this repository.
