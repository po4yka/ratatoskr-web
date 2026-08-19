import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { App } from "./App"

// The one thing worth asserting on a tree with no features: the stack renders a shadcn component,
// and it renders it as something a keyboard and a screen reader can reach. A control that exists
// only as a styled div passes a snapshot and fails a user, so the query is by role and name.
test("renders a shadcn button with an accessible name", () => {
  render(<App />)

  expect(screen.getByRole("heading", { name: "Ratatoskr Web" })).toBeVisible()
  expect(
    screen.getByRole("button", { name: "Nothing to do yet" })
  ).toBeEnabled()
})
