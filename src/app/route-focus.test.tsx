import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { RouteFocusManager } from "@/app/route-focus"
import { renderOwnerView } from "@/test/owner-view-harness"

const pages = {
  operations: { items: [], next_cursor: null },
  schedules: { items: [], next_cursor: null },
  audit: { items: [], next_cursor: null },
}

function responseFor(path: string): Promise<object> {
  if (path === "/v1/admin/schedules") return Promise.resolve(pages.schedules)
  if (path === "/v1/admin/audit-events") return Promise.resolve(pages.audit)
  return Promise.resolve(pages.operations)
}

describe("route focus", () => {
  it("route changes and disclosures keep visible logical focus", async () => {
    renderOwnerView({ path: "/ops", response: responseFor })
    const operationsHeading = await screen.findByRole("heading", {
      name: /recent operations/i,
    })
    await waitFor(() => expect(operationsHeading).toHaveFocus())

    fireEvent.click(screen.getByRole("link", { name: "Schedules" }))
    const scheduleHeading = await screen.findByRole("heading", {
      name: /schedule status/i,
    })
    await waitFor(() => expect(scheduleHeading).toHaveFocus())

    const dark = screen.getByRole("button", { name: "Dark" })
    dark.focus()
    fireEvent.click(dark)
    expect(dark).toHaveFocus()
  })

  it("skip link moves focus to the main landmark", async () => {
    renderOwnerView({ path: "/ops", response: responseFor })
    await screen.findByRole("heading", { name: /recent operations/i })
    const skip = screen.getByRole("link", { name: /skip to content/i })
    fireEvent.click(skip)
    expect(screen.getByRole("main")).toHaveFocus()
  })

  it("does not steal focus after interaction while lazy content mounts", async () => {
    const view = (heading: boolean) => (
      <MemoryRouter>
        <RouteFocusManager />
        <main id="main">
          {heading ? <h1>Lazy route</h1> : null}
          <button type="button">Account</button>
        </main>
      </MemoryRouter>
    )
    const rendered = render(view(false))
    const account = screen.getByRole("button", { name: "Account" })

    account.focus()
    fireEvent.pointerDown(account)
    fireEvent.click(account)
    rendered.rerender(view(true))

    await waitFor(() =>
      expect(screen.getByText("Lazy route")).toBeInTheDocument()
    )
    expect(account).toHaveFocus()
  })
})
