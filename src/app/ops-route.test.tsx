import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"
import {
  forbidden,
  memberCapabilities,
  ownerCapabilities,
} from "@/test/owner-view-harness"

describe("owner operational routes", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    window.history.replaceState(null, "", "/ops")
    storeCustody("member-credential")
  })

  it("member cannot discover or deep-link to owner operations", async () => {
    renderApp({
      gateway: gatewayOf(() => Promise.resolve(memberCapabilities)),
    })

    expect(
      await screen.findByRole("heading", {
        name: /not available in this deployment/i,
      })
    ).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /^operations$/i })).toBeNull()
  })

  it("keeps failed discovery retryable instead of deciding absence", async () => {
    let capabilityReads = 0
    renderApp({
      gateway: gatewayOf(({ path }) => {
        if (path !== "/v1/capabilities") return Promise.reject(forbidden)
        capabilityReads += 1
        return capabilityReads === 1
          ? Promise.resolve(ownerCapabilities)
          : Promise.reject({ kind: "offline" })
      }),
    })

    expect(
      await screen.findByRole("heading", { name: /availability is unknown/i })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /retry/i }))
    await waitFor(() => expect(capabilityReads).toBeGreaterThanOrEqual(3))
  })

  it("shows a live forbidden result after stale capability admission", async () => {
    renderApp({
      gateway: gatewayOf(({ path }) =>
        path === "/v1/capabilities"
          ? Promise.resolve(ownerCapabilities)
          : Promise.reject(forbidden)
      ),
    })

    expect(
      await screen.findByRole("heading", { name: /owner access is required/i })
    ).toBeInTheDocument()
    expect(screen.queryByText(/nothing lives here/i)).toBeNull()
  })
})
