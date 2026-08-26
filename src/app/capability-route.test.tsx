import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { NavEntry } from "@/app/navigation"
import type { GatewayRequest } from "@/api/gateway/client"
import {
  emptyDeployment,
  fullDeployment,
} from "@/capabilities/capability-fixtures"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

/**
 * A registry fixture that marks the real collections destination as requiring
 * `content.submit`, riding through the same seam production entries will.
 */
const gatingRegistry: readonly NavEntry[] = [
  { id: "search", label: "Search", path: "/" },
  {
    id: "collections",
    label: "Collections",
    path: "/collections",
    requires: "content.submit",
  },
]

const collectionsModule = {
  default: () => <p>collections arrived</p>,
}

describe("capability-gated routes", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it("a direct URL into a route whose capability is absent shows the explained absence inside the shell", async () => {
    window.history.replaceState(null, "", "/collections")
    storeCustody("credential-1")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve(emptyDeployment)),
      navEntries: gatingRegistry,
      routeModules: { collections: () => Promise.resolve(collectionsModule) },
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    expect(
      await screen.findByRole("heading", {
        name: /not available in this deployment/i,
      })
    ).toBeInTheDocument()
    expect(screen.queryByText(/collections arrived/i)).not.toBeInTheDocument()
    // The gate explains; it does not redirect or pretend the address is wrong.
    expect(window.location.pathname).toBe("/collections")
  })

  it("the same address renders its view once the document lists the capability", async () => {
    window.history.replaceState(null, "", "/collections")
    storeCustody("credential-1")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve(fullDeployment)),
      navEntries: gatingRegistry,
      routeModules: { collections: () => Promise.resolve(collectionsModule) },
    })

    expect(await screen.findByText(/collections arrived/i)).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", {
        name: /not available in this deployment/i,
      })
    ).not.toBeInTheDocument()
  })

  it("an undecidable read holds the route with retry, which admits it per the fresh answer", async () => {
    window.history.replaceState(null, "", "/collections")
    storeCustody("credential-1")
    let failing = true
    let calls = 0
    renderApp({
      // Boot succeeds on the first call; discovery, after it, meets the
      // failure until the test releases it.
      gateway: gatewayOf(() => {
        calls += 1
        if (calls === 1) return Promise.resolve(fullDeployment)
        return failing
          ? Promise.reject({ kind: "offline" })
          : Promise.resolve(fullDeployment)
      }),
      navEntries: gatingRegistry,
      routeModules: { collections: () => Promise.resolve(collectionsModule) },
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })

    // Discovery failed: availability is unknown, and the route says so with a
    // way back rather than claiming the deployment lacks anything.
    expect(
      await screen.findByRole("button", { name: /^retry$/i })
    ).toBeInTheDocument()
    expect(screen.queryByText(/collections arrived/i)).not.toBeInTheDocument()

    failing = false
    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }))

    // The fresh answer admits the route.
    expect(await screen.findByText(/collections arrived/i)).toBeInTheDocument()
  })

  it("sends no capability traffic while signed out", async () => {
    window.history.replaceState(null, "", "/collections")
    const requests: GatewayRequest[] = []
    renderApp({
      gateway: gatewayOf((request) => {
        requests.push(request)
        return Promise.resolve(fullDeployment)
      }),
    })

    // No custody means boot skips the wire; nothing else may dial out either.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to ratatoskr/i })
      ).toBeInTheDocument()
    })
    expect(requests).toHaveLength(0)
  })
})
