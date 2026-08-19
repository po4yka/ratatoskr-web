import { render, screen } from "@testing-library/react"
import { Liquid } from "liquid-gooey"
import { ThinkingOrb } from "thinking-orbs"
import { expect, test } from "vitest"

/**
 * These two libraries are approved for the design work ahead (ADR-0004) and nothing uses them yet.
 * An unused dependency that quietly stopped working is discovered at the worst possible moment — the
 * day someone reaches for it — so this file is the check that it still mounts under the React and
 * TypeScript versions this repository actually pins.
 *
 * It asserts that they render, not how they look. Both are visual, and a snapshot of a canvas or an
 * SVG filter chain would fail on every upstream tweak while proving nothing.
 */

test("thinking-orbs mounts and takes an accessible name", () => {
  render(<ThinkingOrb state="working" size={20} aria-label="Analysing" />)

  expect(screen.getByLabelText("Analysing")).toBeInTheDocument()
})

test("liquid-gooey mounts with its content layer in the real DOM", () => {
  render(
    <Liquid fill="var(--background)">
      {/* `Liquid.Item`, not a top-level `LiquidItem` import: 0.1.0 declares the type but does not
          export the component. The compound form is the supported one. */}
      <Liquid.Item>
        <button type="button">Still a button</button>
      </Liquid.Item>
    </Liquid>
  )

  // The point of this library's architecture, and the reason it is allowed here: the filter runs on
  // a silhouette layer underneath, and the interactive content stays real DOM. If a future version
  // starts rendering content into the filtered layer, this fails and the approval is void.
  expect(screen.getByRole("button", { name: "Still a button" })).toBeEnabled()
})
