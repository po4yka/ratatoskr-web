import { render, screen, fireEvent, act } from "@testing-library/react"
import { MotionConfig } from "motion/react"
import { expect, test } from "vitest"

import cssText from "../index.css?raw"
import { AnimatedIcon } from "./animated-icon"
import RefreshIcon from "./ui/refresh-icon"

test("is hidden from assistive technology when it has no label", () => {
  const { container } = render(<AnimatedIcon icon={RefreshIcon} />)

  const wrapper = container.querySelector("[data-animated-icon]")!
  expect(wrapper.getAttribute("aria-hidden")).toBe("true")
  expect(screen.queryByRole("img")).toBeNull()
})

test("is an image with a name when it carries meaning", () => {
  render(<AnimatedIcon icon={RefreshIcon} label="Refresh" />)

  const icon = screen.getByRole("img", { name: "Refresh" })
  expect(icon).toBeVisible()
  expect(icon.getAttribute("aria-hidden")).toBeNull()
})

test("carries the attribute the reduced-motion backstop targets", () => {
  const { container } = render(<AnimatedIcon icon={RefreshIcon} />)

  // The stylesheet cannot select what the markup does not carry, and jsdom applies no stylesheet at
  // all, so this attribute is the only part of that contract a unit test can hold.
  expect(container.querySelector("[data-animated-icon]")).not.toBeNull()
})

test("the reduced-motion backstop is still in the stylesheet", () => {
  // A rule nothing references is a rule someone deletes while tidying. This is the check that
  // notices, and it is deliberately crude: jsdom has no cascade to assert against.
  const block = cssText
    .slice(cssText.indexOf("@media (prefers-reduced-motion: reduce)"))
    .slice(0, 600)

  expect(block).toContain("[data-animated-icon]")
  expect(block).toContain("animation: none !important")
  expect(block).toContain("transform: none !important")
})

test("MotionConfig alone does not stop the generated icons, which is why the CSS exists", async () => {
  // The measurement `animated-icon.tsx` and `index.css` both cite. If a future motion release starts
  // covering the imperative `animate()` path, this test fails and the CSS backstop can be
  // reconsidered — that is the only reason it asserts the unhelpful behavior rather than the
  // helpful one.
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia

  const { container } = render(
    <MotionConfig reducedMotion="user">
      <AnimatedIcon icon={RefreshIcon} />
    </MotionConfig>
  )

  const svg = container.querySelector("svg")!
  await act(async () => {
    fireEvent.pointerEnter(svg)
    // Past the icon's 400ms duration, so the assertion reads a settled value rather than a
    // sample from the middle of the curve.
    await new Promise((resolve) => setTimeout(resolve, 700))
  })

  expect(svg.getAttribute("style")).toContain("rotate(180deg)")
})
