## Why

`src/components/shell/shell.test.tsx > the shell surface > reaches sign-out from the keyboard and confirms before revoking` failed three `ci` runs on `main` in one day — 33042070571, 33047091729 and 33092164295 — each with `TestingLibraryElementError: Unable to find role="menuitem" and name /sign out/i`, and passed on every run either side. A test that fails on some runs and passes on others with no intervening change is a defect in the gate: it tells the reader that a red run may mean nothing, which is the property that makes people stop reading red runs.

Two things were true at once, and only fixing both makes the test deterministic.

The menu does open. A probe that fired the same events and then polled found the menu item every time; a probe that fired only the keyboard events never found it, which is why the test already fires the synthetic click that jsdom does not synthesize after Enter. So there is no lost event and no broken interaction — the test was measured finishing at 1076ms, seventy-six milliseconds past Testing Library's 1000ms default poll window.

Part of that wall-clock cost was work the test never needed. `renderAuthenticatedShell` and the deep-link test both mounted the real application with the default lazy route registry, so each one also paid for Vitest transforming a feature page and its whole dependency subtree — the search page for the shell-chrome tests, the collections page for the redirect test. None of those tests assert anything about those pages.

## What Changes

- Both shell tests inject an already-resolved route module through `RouterSeams.routeModules`, the seam the router documents for exactly this and that `lazy-route.test.tsx` already uses. This removes the module-transform cost from tests that do not assert on the page being transformed.
- `src/test/setup.ts` raises Testing Library's `asyncUtilTimeout` from the 1000ms default to 5000ms, and `vite.config.ts` raises Vitest's own per-test timeout to 10000ms so the outer bound stays above the inner one.

## Capabilities

No product behaviour changes and no assertion changes. `skip_specs: true` is set in the change manifest.

## Impact

- `src/components/shell/shell.test.tsx`, `src/test/setup.ts`, `vite.config.ts`.
- No component, route, contract, or generated artifact.
