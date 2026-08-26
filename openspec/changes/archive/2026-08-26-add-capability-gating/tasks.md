## 1. Fixtures and the gate rule

- [x] 1.1 RED: add `src/capabilities/capability-fixtures.ts` with fixture documents — full deployment (`content.submit`, `telegram.mini_app`), empty, partial, and one carrying unfamiliar extra names — plus `src/capabilities/gating.test.ts` asserting the truth table: ungated is available in loading/failed/ready states; gated resolves pending while loading; gated over a document listing the requirement is available; over one omitting it is unavailable naming the missing capability; an empty document makes every gated feature unavailable; unfamiliar extra names decide nothing; a failed read yields undecidable, never unavailable. Confirm it fails because `src/capabilities/vocabulary.ts` and `gating.ts` do not exist. (Confirmed: module-not-found red.)
- [x] 1.2 GREEN: implement `src/capabilities/vocabulary.ts` (closed literal union) and `src/capabilities/gating.ts` (one total `evaluateGate`) until 1.1 passes.

## 2. Capability discovery context

- [x] 2.1 RED: add `src/capabilities/capabilities-context.test.tsx`: "reads the document through the gateway when mounted", "sends nothing while unauthenticated", "a failed read leaves no document and retry re-reads", "connectivity restored re-reads the document" — confirm they fail because the context does not exist. (Confirmed: module-not-found red. The signed-out case lives at composition level in `src/app/capability-route.test.tsx`, because the provider is mounted only around authenticated sessions.)
- [x] 2.2 GREEN: implement `src/capabilities/capabilities-context.tsx` (provider + hook exposing status, document, retry; refresh on the browser online event) until 2.1 passes.

## 3. Shell integration

- [x] 3.1 RED: add nav gating cases against fixture requirements via the registry seam (`src/components/shell/nav-gating.test.tsx`, split out of `shell.test.tsx` for the file-size limit): a nav entry whose requirement the held document lists renders; the same entry with the capability absent does not render; entries without a requirement render while the read is pending and while it has failed. Confirmed failing for the first two against hard-coded navigation; the pending/failed case passed immediately on first run once its discovery-attempted assertion was added, so it is kept as the regression pin for that behavior rather than claimed as a red-green driver.
- [x] 3.2 GREEN: add `src/app/navigation.ts` (registry), drive shell navigation from it filtered by verdicts, and mount the capability context around the protected shell in `src/App.tsx`, until 3.1 passes.

## 4. Route gate

- [x] 4.1 RED: add `src/app/capability-route.test.tsx` mounting the real router composition through the app harness with an overridden registry entry marking collections as requiring a capability: direct URL to `/collections` with that capability absent from the fixture document renders the explained absence inside the shell and none of the feature view; with the capability present the view renders, proving absence is not not-found; opening the gated route while the read has failed renders the failure state whose retry admits or refuses per the fresh answer. Confirmed failing for the absent and undecidable cases against ungated routes; the capability-present case and the no-traffic-while-signed-out case passed immediately and are kept as regression pins.
- [x] 4.2 GREEN: implement the route gate wrapper (`src/app/gated-route.tsx`, wired into `src/app/router.tsx`) and the two surfaces beside `src/app/gate-surfaces.tsx` until 4.1 passes.

## 5. Documentation

- [x] 5.1 Update `README.md` capability-driven rendering section and `docs/ARCHITECTURE.md` section 6 pointers to match shipped reality (documentation; no failing test applies). Also records plan item 5 as done in `docs/IMPLEMENTATION_PLAN.md` and the new verified shadscan advisory in `DEVELOPMENT.md`.

## 6. Gate

- [x] 6.1 Run the full DEVELOPMENT.md command list — api:check, typecheck, lint, format:check, test, build, audit:ui --fail-under 79 — and confirm green. All seven green; 127 tests pass; shadscan holds the 79 ratchet after fixing the `mobile-nav-present` regression with an explicit small-screen layout on the primary navigation.
- [x] 6.3 Review round (code-review skill, two parallel axes): fixed the reconnect behavior to chase a lost answer only instead of wiping a held document on every online event (test-first), and closed the two coverage gaps it found — the route region's pending state and the retry-refuses path. Gate re-run green; 130 tests pass.
- [x] 6.2 Run `openspec validate --change add-capability-gating --strict` and confirm the change validates; archive only after every task above is ticked.
