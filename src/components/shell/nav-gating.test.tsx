import { cleanup, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { NavEntry } from "@/app/navigation"
import type { Gateway } from "@/api/gateway/client"
import {
  captureOnlyDeployment,
  fullDeployment,
} from "@/capabilities/capability-fixtures"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

/**
 * A registry fixture with one entry that requires `content.submit`, riding
 * beside the two real entries. It goes through the same seam production
 * registries will, so the gating is exercised end to end.
 */
const gatedRegistry: readonly NavEntry[] = [
  { id: "search", label: "Search", path: "/" },
  { id: "collections", label: "Collections", path: "/collections" },
  {
    id: "capture",
    label: "Capture",
    path: "/capture",
    requires: "content.submit",
  },
]

describe("capability-gated navigation", () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
    localStorage.clear()
  })

  it("shows a nav entry whose requirement the document lists", async () => {
    storeCustody("credential-1")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve(fullDeployment)),
      navEntries: gatedRegistry,
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    expect(
      await screen.findByRole("link", { name: /capture/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /^search$/i })).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^collections$/i })
    ).toBeInTheDocument()
  })

  it("hides a nav entry whose requirement the document omits and keeps core entries", async () => {
    storeCustody("credential-1")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve(captureOnlyDeployment)),
      navEntries: gatedRegistry,
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /capture/i })
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole("link", { name: /^collections$/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /^search$/i })).toBeInTheDocument()
  })

  it("keeps core entries while discovery is pending or has failed", async () => {
    /**
     * Boot resolves on the first call; every later call — discovery among
     * them — meets the fate `settled` chooses.
     */
    function bootThen(settled: () => Promise<unknown>): {
      gateway: Gateway
      calls: () => number
    } {
      let calls = 0
      return {
        gateway: gatewayOf(() => {
          calls += 1
          return calls === 1 ? Promise.resolve(fullDeployment) : settled()
        }),
        calls: () => calls,
      }
    }

    // Discovery never answers: the read hangs after boot.
    storeCustody("credential-1")
    const hanging = bootThen(() => new Promise(() => {}))
    renderApp({ gateway: hanging.gateway, navEntries: gatedRegistry })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    // Discovery must actually be attempted by the composition, not skipped.
    await waitFor(() => {
      expect(hanging.calls()).toBeGreaterThanOrEqual(2)
    })
    expect(screen.getByRole("link", { name: /^search$/i })).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /capture/i })
    ).not.toBeInTheDocument()

    // Discovery fails: the core entries survive that too.
    cleanup()
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
    localStorage.clear()
    storeCustody("credential-2")
    const failing = bootThen(() => Promise.reject({ kind: "offline" }))
    renderApp({ gateway: failing.gateway, navEntries: gatedRegistry })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    expect(screen.getByRole("link", { name: /^search$/i })).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /capture/i })
    ).not.toBeInTheDocument()
  })
})
