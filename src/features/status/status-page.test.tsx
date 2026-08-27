import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PresentedCredentialProvider } from "@/auth/provider"
import { gatewayOf, renderApp } from "@/test/app-harness"

const degradedStatus = {
  generated_at: "2026-08-27T12:00:00Z",
  state: "degraded",
  components: [
    { id: "api", state: "operational", stale: false },
    {
      id: "command_delivery",
      state: "degraded",
      observed_at: "2026-08-27T11:55:00Z",
      stale: true,
    },
  ],
}

describe("public status page", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    window.history.replaceState(null, "", "/status")
  })

  it("anonymous degraded status stays outside session boot", async () => {
    const requests: string[] = []
    const probe = vi.fn().mockResolvedValue("unauthenticated" as const)
    const provider: PresentedCredentialProvider = {
      probe,
      signIn: vi.fn(),
      refresh: vi.fn(),
      revoke: vi.fn(),
      tokenSource: { current: () => null },
    }

    renderApp({
      provider,
      gateway: gatewayOf(({ path }) => {
        requests.push(path)
        return Promise.resolve(degradedStatus)
      }),
    })

    expect(
      await screen.findByRole("heading", { name: /system status/i })
    ).toBeInTheDocument()
    expect(await screen.findAllByText(/^degraded$/i)).toHaveLength(2)
    expect(screen.getByText(/command delivery/i)).toBeInTheDocument()
    expect(screen.getByText(/stale/i)).toBeInTheDocument()
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument()
    expect(probe).not.toHaveBeenCalled()
    expect(requests).toEqual(["/v1/status"])
  })

  it("does not present an offline request as an operational status", async () => {
    const probe = vi.fn().mockResolvedValue("unauthenticated" as const)
    const provider: PresentedCredentialProvider = {
      probe,
      signIn: vi.fn(),
      refresh: vi.fn(),
      revoke: vi.fn(),
      tokenSource: { current: () => null },
    }

    renderApp({
      provider,
      gateway: gatewayOf(() => Promise.reject(new Error("offline"))),
    })

    expect(
      await screen.findByRole("heading", {
        name: /current status is unreachable/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    expect(screen.queryByText(/^operational$/i)).not.toBeInTheDocument()
    expect(probe).not.toHaveBeenCalled()
  })
})
