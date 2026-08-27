# Accessibility checklist

Observed on 2026-08-27 with Playwright Chromium 151 and axe-core 4.13 through
`npx playwright test e2e/accessibility.spec.ts e2e/keyboard-navigation.spec.ts`.
This file records checks that were run. It does not stand in for assistive-technology testing.

## Route matrix

The automated matrix covers each route in light and dark themes at 320 by 720 and 1280 by 800 CSS
pixels. All 32 combinations passed after the fixes below.

| Surface                  | State exercised                         | Result     |
| ------------------------ | --------------------------------------- | ---------- |
| `/status`                | anonymous degraded and stale status     | 4/4 passed |
| `/ops`                   | authenticated member, explained absence | 4/4 passed |
| `/ops`                   | owner operation list                    | 4/4 passed |
| `/ops/schedules`         | owner schedule status                   | 4/4 passed |
| `/ops/audit`             | owner audit trail                       | 4/4 passed |
| `/login`                 | unauthenticated form                    | 4/4 passed |
| `/`                      | authenticated search fixture            | 4/4 passed |
| `/documents/document-ir` | authenticated reader fixture            | 4/4 passed |

Each combination asserts:

- no serious or critical WCAG 2.0/2.1 A/AA axe violation;
- exactly one `main` landmark;
- no document-level horizontal overflow beyond one rounding pixel;
- every rendered authored link, button, input, select, and textarea has a target at least 24 by 24
  CSS pixels, excluding the intentionally hidden skip link before focus.

## Findings and fixes

| Finding                                                                             | Failing evidence                                                                         | Fix                                                                                                    | Passing evidence                                                |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Route changes left focus on the old control or document body.                       | `src/app/route-focus.test.tsx`; `e2e/keyboard-navigation.spec.ts`                        | One pathname-driven focus manager waits for lazy content and focuses the route `h1`.                   | 2 Vitest and 2 Chromium keyboard tests passed.                  |
| The skip link changed the fragment without focusing the landmark.                   | The same unit and browser tests.                                                         | Both public and protected `main` elements are explicit focus targets; skip activation focuses them.    | Enter activation focuses `main` in Chromium.                    |
| Protected pages overflowed by 52–54px at 320px.                                     | First rendered matrix run failed member, owner, search, and reader cases in both themes. | The protected header stacks below the `sm` breakpoint and its navigation may wrap within the viewport. | All narrow cases report at most one rounding pixel of overflow. |
| Theme, navigation, search-result, and provenance controls rendered at 18–24px high. | First rendered matrix run listed the undersized elements.                                | Authored controls now use a stable 28px minimum target.                                                | All 32 target-size assertions passed.                           |

## Keyboard and focus

| Check                                                       | Result                                              | Evidence                                |
| ----------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| Skip link is first and reaches `main` with Enter.           | Passed                                              | `e2e/keyboard-navigation.spec.ts`       |
| Route navigation focuses the new `h1`.                      | Passed                                              | unit and Chromium route-focus tests     |
| A theme update does not steal focus.                        | Passed                                              | `src/app/route-focus.test.tsx`          |
| Links activate with Enter; buttons activate with Space.     | Passed                                              | operational navigation and theme checks |
| Account disclosure opens with Enter and closes with Escape. | Passed                                              | Chromium keyboard test                  |
| Closing the sign-out dialog returns focus to Account.       | Passed                                              | Chromium keyboard test                  |
| Focus has a theme-token ring in both themes.                | Passed by authored CSS and browser focus assertions | `src/index.css`; route-focus tests      |

## Semantics, contrast, and motion

| Check                                                                                      | Result                                                      | Evidence                                                                                       |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| One named primary navigation and one main landmark.                                        | Passed                                                      | axe matrix and explicit landmark assertion                                                     |
| Loading, error, empty, forbidden, degraded, and stale states remain text, not color alone. | Passed                                                      | component tests and axe matrix                                                                 |
| Form control has an associated label and native required state.                            | Passed                                                      | login matrix                                                                                   |
| Light and dark contrast has no serious/critical axe finding.                               | Passed                                                      | all 32 combinations                                                                            |
| Reduced-motion backstops remain present for declarative and vendored motion.               | Passed by existing automated coverage and source inspection | `src/components/animated-icon.test.tsx`; `src/test/design-libraries.test.tsx`; `src/index.css` |

## Not verified

- No VoiceOver, NVDA, JAWS, TalkBack, braille display, switch-control, or speech-input session was
  performed. Screen-reader announcements and reading order therefore remain unverified by a real
  assistive technology.
- Browser zoom above 100% and OS-level forced-colors mode were not exercised in this pass.
- The matrix uses deterministic fixture and mock-Platform data, not a live user archive.

## Shadscan evidence

`npm run audit:ui` passed at 80/100 against the repository ratchet of 79. The existing
`theme-hotkey-present` false negative remains: the guarded `d` shortcut is implemented and tested in
`src/components/theme-provider.tsx`. Command palette and toast findings remain explicit product
waivers; this change does not add unused infrastructure for a score.

Rendered shadscan 0.17.0 ran through `scripts/shadscan-vite.config.ts`, which injects only the mock
owner credential and selected theme into the audit-only Vite page. It checked `/status`, `/ops`,
`/ops/schedules`, `/ops/audit`, and the operation-detail route at 320 by 820 and 1440 by 1000.
Light and dark runs each passed 10 of 10 measurements with zero overflow; every protected route kept
its requested final path instead of redirecting to login.
