import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { App } from "./App"

// The root composition with its production wiring must render a designed
// surface on first paint — never a blank tree and never a network call that
// decides what may show. The pending state is synchronous; whatever the
// session answer turns out to be arrives later through the same seam.
test("boots into the designed pending state before any session answer", () => {
  render(<App />)

  expect(screen.getByRole("status")).toHaveTextContent(
    "Checking your session…"
  )
})
