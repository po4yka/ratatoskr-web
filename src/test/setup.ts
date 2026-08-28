import "@testing-library/jest-dom/vitest"
import { cleanup, configure } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

/**
 * `findBy*` and `waitFor` poll for 1000ms by default before giving up. That number is a Testing
 * Library default tuned for an idle developer machine, and it is not an assertion: a query whose
 * element never appears still throws the same `TestingLibraryElementError`, just later. What it
 * does decide is how slow a machine is allowed to be before a correct render is reported as a
 * defect.
 *
 * On a two-core hosted runner it is too tight. `shell.test.tsx`'s account-menu test renders the
 * whole application and then opens a portalled menu, and it was measured finishing that at 1076ms
 * — 76ms past the window — which turned it red in `ci` runs 33042070571, 33047091729 and
 * 33092164295 while passing everywhere else. `vite.config.ts` sets `fileParallelism: false`, so
 * this is not contention between test files; it is the wall-clock cost of the work itself.
 *
 * Raising the window does not make a broken menu pass, and it is deliberately paired with removing
 * the unnecessary work: the shell tests inject already-resolved route modules through the router's
 * test seam instead of waiting on Vitest to transform a feature page none of them assert on.
 * `vite.config.ts` raises Vitest's own per-test timeout to stay above this one.
 */
configure({ asyncUtilTimeout: 5000 })

// Every test gets a clean document. Without this a component from an earlier test is still mounted,
// and a query that should find one element finds two.
afterEach(cleanup)

/**
 * jsdom implements no `matchMedia`, and anything that asks about `prefers-reduced-motion` or
 * `prefers-color-scheme` throws on mount rather than degrading — which is how `liquid-gooey` first
 * failed here. The default answers "no" to every query; a test that cares about a preference
 * overrides `window.matchMedia` itself, and this `beforeEach` puts the default back afterwards.
 */
beforeEach(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

/**
 * jsdom implements no `ResizeObserver` either, and a component that measures itself on mount throws
 * rather than skipping the measurement. The stub observes nothing and reports nothing, which is the
 * honest answer in an environment with no layout: a test that needs real geometry needs a browser,
 * not a better stub.
 */
class NoopResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= NoopResizeObserver
