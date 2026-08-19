import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"

import { ErrorBoundary } from "./error-boundary"

function Explodes(): never {
  throw new Error("boom")
}

// The boundary's whole value is that it catches, so the test has to actually throw. React logs the
// caught error to the console on its own, which would make a passing run look like a failing one.
test("renders a recoverable alert instead of propagating a render error", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

  render(
    <ErrorBoundary region="test">
      <Explodes />
    </ErrorBoundary>
  )

  expect(screen.getByRole("alert")).toBeVisible()
  expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled()

  consoleError.mockRestore()
})

test("renders its children when nothing throws", () => {
  render(
    <ErrorBoundary region="test">
      <p>fine</p>
    </ErrorBoundary>
  )

  expect(screen.getByText("fine")).toBeVisible()
  expect(screen.queryByRole("alert")).toBeNull()
})
