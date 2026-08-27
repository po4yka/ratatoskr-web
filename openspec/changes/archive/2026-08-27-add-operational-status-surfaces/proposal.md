## Why

Owners cannot inspect deployment-wide operations, schedules, or audit history in the browser, and
visitors cannot distinguish a healthy deployment from a degraded one without signing in. The fleet
change `add-operational-status-workspace-integration` now provides the generated Edge contracts that
make these views possible without crossing Web's public API boundary.

## What Changes

- Add an anonymous `/status` route that renders sanitized current, stale, degraded, unavailable,
  unknown, and offline states without starting a session.
- Add capability-gated owner routes for recent operations, schedule visibility, and audit history,
  including bounded cursor navigation and distinct loading, empty, partial, forbidden, and failure
  states.
- Harden route focus, landmarks, skip navigation, contrast, responsive layout, reduced motion, and
  keyboard behavior across the affected shell and public route.
- Add Chromium end-to-end and axe coverage, a committed accessibility checklist, and current Web
  documentation.
- Regenerate browser API types from the verified Platform OpenAPI revision and keep every request on
  the existing Edge gateway.
- Leave LLM cost dashboards, digest/RSS/signals/chat-agent surfaces, EN/RU localization, and the
  command palette for the recorded fleet decisions that own their missing contracts or framework.

## Capabilities

### New Capabilities

- `public-status-page`: Anonymous, truthful rendering of the sanitized Platform status document.
- `owner-operational-views`: Capability-gated operations, schedules, and audit inspection through
  generated public Edge routes.
- `accessible-route-shell`: Focus, landmark, keyboard, contrast, responsive, and audit evidence
  guarantees for the affected application surfaces.

### Modified Capabilities

- `capability-gating`: Add the three independent operational capabilities to navigation and deep-link
  presentation while preserving Platform enforcement.

## Impact

- Affects the generated API pin/types, gateway consumers, top-level router, authenticated shell,
  navigation registry, new status and owner-operation feature areas, browser test tooling, CI gate,
  README, and development/testing/architecture documentation.
- Adds `@playwright/test` and `@axe-core/playwright` as development-only dependencies in their own
  commit; neither enters the production bundle.
- Requires Platform remote `main` commit
  `3b6efb1942d0ebc7735faa8ceb04338a54b535db` and the fleet composed-profile smoke after Web is
  published.
