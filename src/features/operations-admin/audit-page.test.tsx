import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { components } from "@/api/generated/schema"
import {
  forbidden,
  offline,
  renderOwnerView,
  terminal,
} from "@/test/owner-view-harness"

type Page = components["schemas"]["AuditEventPage"]

const auditPage: Page = {
  items: [
    {
      audit_event_id: "018f0000-0000-7000-8000-000000000020",
      occurred_at: "2026-08-27T12:00:00Z",
      action: "operation.read",
      outcome: "allowed",
      target_kind: "operation",
      target_id: "018f0000-0000-7000-8000-000000000001",
      correlation_id: "operation:018f0000-0000-7000-8000-000000000001",
    },
  ],
  next_cursor: "audit-page-two",
}

describe("audit trail", () => {
  it("announces a pending bounded read", async () => {
    renderOwnerView({
      path: "/ops/audit",
      response: () => new Promise(() => {}),
    })
    expect(await screen.findByText(/loading audit events/i)).toHaveAttribute(
      "role",
      "status"
    )
  })

  it("renders bounded audit actors and empty separately from failure", async () => {
    const { requests } = renderOwnerView({
      path: "/ops/audit",
      response: auditPage,
    })

    expect(
      await screen.findByRole("heading", { name: /audit trail/i })
    ).toBeInTheDocument()
    expect(await screen.findByText("operation.read")).toBeInTheDocument()
    expect(screen.getByText(/^unknown actor$/i)).toBeInTheDocument()
    expect(screen.getByText(/^allowed$/i)).toBeInTheDocument()
    expect(screen.getByText(/operation:018f/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /next page/i }))
    await waitFor(() =>
      expect(requests.some((path) => path.includes("audit-page-two"))).toBe(
        true
      )
    )
    cleanup()

    const empty = renderOwnerView({
      path: "/ops/audit",
      response: { items: [] },
    })
    expect(
      await screen.findByText(/no audit events were returned/i)
    ).toBeInTheDocument()
    empty.unmount()
  })

  it.each([
    [offline, /offline/i],
    [terminal, /could not be read/i],
  ])("renders %o as a failed read", async (failure, copy) => {
    renderOwnerView({
      path: "/ops/audit",
      response: () => Promise.reject(failure),
    })
    expect(await screen.findByRole("alert")).toHaveTextContent(copy)
  })

  it("keeps a live forbidden response visible", async () => {
    renderOwnerView({
      path: "/ops/audit",
      response: () => Promise.reject(forbidden),
    })
    expect(
      await screen.findByRole("heading", { name: /owner access is required/i })
    ).toBeInTheDocument()
  })
})
