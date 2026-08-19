import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

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
