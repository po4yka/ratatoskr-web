## 1. Contract and browser tooling

- [x] 1.1 Update the Platform OpenAPI source and digest to verified commit `3b6efb1`, run
  `npm run api:check`, and record the expected generated-type drift failure; pinning is generated
  configuration, so this is the contract RED rather than a behavior test.
- [x] 1.2 Run `npm run api:gen`, review the generated TypeScript diff, rerun `npm run api:check`, and
  commit only the pin/OpenAPI/generated files.
- [x] 1.3 Add development-only `@playwright/test` and `@axe-core/playwright`, Chromium configuration,
  and the bounded mock-Platform runner; configuration cannot start from a behavior test, so verify
  installation, licenses, dev-only placement, and absence from a production bundle, then commit the
  dependency addition separately.

## 2. Anonymous status

- [x] 2.1 RED: add `src/features/status/status-page.test.tsx` and
  `e2e/public-status.spec.ts` test `anonymous degraded status stays outside session boot`; assert only
  `GET /v1/status` is sent, degraded/stale text renders, no login redirect occurs, and offline differs
  from successful status, then run both and record the missing-route failure.
- [x] 2.2 GREEN: implement the generated status source, lazy standalone route, semantic document,
  retry, stale labeling, and metadata until the tests from 2.1 pass in both themes.

## 3. Operational gating and views

- [x] 3.1 RED: extend `src/components/shell/nav-gating.test.tsx` and add
  `src/app/ops-route.test.tsx` test `member cannot discover or deep-link to owner operations`; assert
  independent operational capabilities, retryable discovery failure, and visible Platform forbidden
  after stale admission, then run and record the gating failure.
- [x] 3.2 GREEN: add the exact capability vocabulary, grouped navigation, lazy `/ops`,
  `/ops/schedules`, and `/ops/audit` routes, and absence/forbidden surfaces until 3.1 passes without
  treating presentation as authorization.
- [x] 3.3 RED: add `src/features/operations-admin/operations-page.test.tsx` test
  `renders every lifecycle and safe failure without private diagnostics`; assert loading, empty,
  cursor, offline, forbidden, failed, and partially-succeeded states through generated admin paths,
  then run and record the missing-view failure.
- [x] 3.4 GREEN: implement the operations source, bounded list/detail view, URL cursor, and exact text
  labels until 3.3 passes without client-owned wire types or unbounded filtering.
- [x] 3.5 RED: add `src/features/operations-admin/schedules-page.test.tsx` test
  `renders unknown disabled and failed schedule truthfully`; assert loading, empty, pagination,
  absent outcome, disabled/failed, offline, and forbidden states, then run and record the missing-view
  failure.
- [x] 3.6 GREEN: implement the generated schedule source and responsive semantic presentation until
  3.5 passes without rendering payload or configuration fields.
- [x] 3.7 RED: add `src/features/operations-admin/audit-page.test.tsx` test
  `renders bounded audit actors and empty separately from failure`; assert unknown actor, readable
  contracted fields, cursor pagination, empty, offline, forbidden, and terminal states, then run and
  record the missing-view failure.
- [x] 3.8 GREEN: implement the generated audit source and bounded viewer until 3.7 passes without
  payload export, diagnostics, or private-data logging.

## 4. Accessibility hardening and evidence

- [x] 4.1 RED: add `src/app/route-focus.test.tsx` and
  `e2e/keyboard-navigation.spec.ts` test `route changes and disclosures keep visible logical focus`;
  assert skip-link destination, h1 focus after navigation, no refresh focus theft, logical Tab order,
  Enter/Space/Escape operation, and trigger focus return, then record the focus failure.
- [x] 4.2 GREEN: implement one route-focus manager and fix affected authored components outside
  generated directories until 4.1 passes.
- [ ] 4.3 Run the Playwright axe matrix across status, member `/ops`, owner operations, schedules,
  audit, login, search, and reader in both themes at 320px and 1280px; commit observed automated and
  manual results to `docs/ACCESSIBILITY_CHECKLIST.md`, marking screen-reader work unverified unless
  performed.
- [ ] 4.4 For each serious/critical axe or manual keyboard/landmark/focus/contrast/reduced-motion/
  target-size/mobile finding from 4.3, append a named RED task below before its paired GREEN fix, then
  rerun the matrix until serious/critical findings are zero and every checklist row maps to evidence.
- [ ] 4.5 Run `npm run audit:ui` and rendered shadscan against every new route in both themes and
  target widths; fix only confirmed findings through appended RED/GREEN pairs and never lower the
  score ratchet.

## 5. Documentation, gate, and lifecycle

- [ ] 5.1 Update README, DEVELOPMENT, IMPLEMENTATION_PLAN, TESTING, ARCHITECTURE, and affected status
  text after behavior exists; documentation cannot start from a behavior test, so verify it describes
  the implemented router/API/views/e2e suite and keeps localization, command palette, LLM costs, and
  agent/digest/RSS/signals surfaces deferred.
- [ ] 5.2 Add `test:e2e` to the documented and hosted gate with pinned Chromium installation and a
  parity assertion; CI configuration cannot start from a behavior test, so verify local/workflow
  command identity.
- [ ] 5.3 Run the exact Web gate in order: clean install, API check, typecheck, lint, format check,
  Vitest, Playwright, build through `build-gate --`, shadscan, rendered checks, and production audit;
  inspect bundle and final diff for privacy, generated-contract, accessibility, and scope regressions.
- [ ] 5.4 Validate, sync, and archive this OpenSpec change with every task checked; verify archived
  strict validation and the required separate contract, dependency, and feature/evidence commits.
