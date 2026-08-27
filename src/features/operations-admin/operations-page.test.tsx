import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { components } from "@/api/generated/schema"
import { forbidden, offline, renderOwnerView } from "@/test/owner-view-harness"

type Page = components["schemas"]["OperationInspectionPage"]

const lifecyclePage: Page = {
  items: [
    "accepted",
    "queued",
    "running",
    "succeeded",
    "partially_succeeded",
    "failed",
    "cancelled",
  ].map((status, index) => ({
    operation_id: `018f0000-0000-7000-8000-00000000000${index}`,
    owner_user_id: "018f0000-0000-7000-8000-000000000099",
    kind: `fixture.kind.${index}`,
    status: status as components["schemas"]["OperationStatus"],
    accepted_at: "2026-08-27T10:00:00Z",
    status_changed_at: "2026-08-27T10:01:00Z",
    failure_code:
      status === "failed" || status === "partially_succeeded"
        ? `fixture.${status}`
        : undefined,
  })),
  next_cursor: "page-two",
}

describe("operations inspector", () => {
  it("announces a pending bounded read", async () => {
    renderOwnerView({ path: "/ops", response: () => new Promise(() => {}) })
    expect(await screen.findByText(/loading operations/i)).toHaveAttribute(
      "role",
      "status"
    )
  })

  it("renders every lifecycle and safe failure without private diagnostics", async () => {
    const { requests } = renderOwnerView({
      path: "/ops",
      response: lifecyclePage,
    })

    expect(
      await screen.findByRole("heading", { name: /recent operations/i })
    ).toBeInTheDocument()
    expect((await screen.findAllByText("Accepted")).length).toBeGreaterThan(1)
    for (const state of [
      "Queued",
      "Running",
      "Succeeded",
      "Partially succeeded",
      "Failed",
      "Cancelled",
    ]) {
      expect(screen.getByText(state)).toBeInTheDocument()
    }
    expect(screen.getByText("fixture.failed")).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/stack|payload|diagnostic/i)

    fireEvent.click(screen.getByRole("button", { name: /next page/i }))
    await waitFor(() => expect(window.location.search).toContain("page-two"))
    expect(requests.some((path) => path.includes("cursor=page-two"))).toBe(true)
  })

  it("keeps empty offline and forbidden results distinct", async () => {
    const first = renderOwnerView({ path: "/ops", response: { items: [] } })
    expect(
      await screen.findByText(/no operations were returned/i)
    ).toBeInTheDocument()
    first.unmount()

    renderOwnerView({ path: "/ops", response: () => Promise.reject(offline) })
    expect(await screen.findByRole("alert")).toHaveTextContent(/offline/i)
    document.body.replaceChildren()

    renderOwnerView({ path: "/ops", response: () => Promise.reject(forbidden) })
    expect(
      await screen.findByRole("heading", { name: /owner access is required/i })
    ).toBeInTheDocument()
  })

  it("opens the generated operation detail without private diagnostics", async () => {
    const operationId = lifecyclePage.items[5].operation_id
    const detail: components["schemas"]["OperationSnapshot"] = {
      operation_id: operationId,
      correlation_id: `operation:${operationId}`,
      kind: "fixture.kind.5",
      status: "failed",
      accepted_at: "2026-08-27T10:00:00Z",
      status_changed_at: "2026-08-27T10:01:00Z",
      terminated_at: "2026-08-27T10:01:00Z",
      stage: "validating",
      progress_percent: 65,
      retryable: true,
      errors: [
        {
          code: "fixture.failed",
          message: "The operation could not finish.",
          retryable: true,
          partial_effects: false,
        },
      ],
    }
    renderOwnerView({
      path: "/ops",
      response: (path) =>
        Promise.resolve(path.includes(operationId) ? detail : lifecyclePage),
    })

    fireEvent.click(await screen.findByRole("link", { name: operationId }))
    expect(
      await screen.findByRole("heading", { name: /operation detail/i })
    ).toBeInTheDocument()
    expect(screen.getByText("fixture.failed")).toBeInTheDocument()
    expect(screen.getByText(/65%/i)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/stack|payload|diagnostic/i)
  })
})
