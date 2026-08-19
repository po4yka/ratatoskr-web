import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { AicssBlock } from "./aicss-block"
import { ThinkingState } from "./aicss/ThinkingState"

test("marks vendored motion so the reduced-motion backstop can reach it", () => {
  const { container } = render(
    <AicssBlock>
      <ThinkingState />
    </AicssBlock>
  )

  // The stylesheet cannot select what the markup does not carry, and jsdom applies no cascade, so
  // the attribute is the part of that contract a unit test can hold. The rule itself is asserted in
  // `animated-icon.test.tsx`, which reads the stylesheet.
  expect(container.querySelector("[data-vendored-motion]")).not.toBeNull()
})

test("announces its changes only when asked to", () => {
  const { rerender } = render(
    <AicssBlock status>
      <ThinkingState />
    </AicssBlock>
  )
  expect(screen.getByRole("status")).toBeInTheDocument()

  rerender(
    <AicssBlock>
      <ThinkingState />
    </AicssBlock>
  )
  // A table or a code block is read on demand. Wrapping one in a live region makes a screen reader
  // interrupt the user every time a row changes, which is why this is opt-in rather than default.
  expect(screen.queryByRole("status")).toBeNull()
})

test("the vendored component still renders through the wrapper", () => {
  render(
    <AicssBlock status>
      <ThinkingState />
    </AicssBlock>
  )

  expect(screen.getByText("Thinking")).toBeVisible()
})
