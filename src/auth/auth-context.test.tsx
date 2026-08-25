import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import type { ApiOfflineError } from "@/api/gateway/errors"
import { storeCustody } from "./custody"
import { createPresentedCredentialProvider } from "./provider"
import type { SessionWiring } from "./session-gateway"
import App from "@/App"

function gatewayOf(run: (request: GatewayRequest) => Promise<unknown>): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

function wiringOf(gateway: Gateway): SessionWiring {
  return { gateway, provider: createPresentedCredentialProvider({ gateway }) }
}

const offline: ApiOfflineError = { kind: "offline" }

describe("the application boot sequence", () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("renders a designed pending state while the session question is open", () => {
    render(<App wiring={wiringOf(gatewayOf(() => new Promise(() => {})))} />)

    expect(screen.getByRole("status")).toHaveTextContent(
      /checking your session/i
    )
    expect(screen.queryByRole("banner")).not.toBeInTheDocument()
  })

  it("renders the protected shell when boot resolves authenticated", async () => {
    storeCustody("credential-1")
    render(<App wiring={wiringOf(gatewayOf(() => Promise.resolve({ capabilities: [] })))} />)

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    expect(screen.getByRole("navigation")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })

  it("renders the unauthorized surface when boot resolves unauthenticated", async () => {
    render(<App wiring={wiringOf(gatewayOf(() => Promise.resolve({ capabilities: [] })))} />)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to ratatoskr/i })
      ).toBeInTheDocument()
    })
  })

  it("renders a boot-failure state with a working retry when Platform cannot be asked", async () => {
    // Custody is held, so boot must ask Platform about it; the deployment
    // never answers, which is a different surface than being signed out.
    storeCustody("credential-1")
    const probe = vi.fn<() => Promise<unknown>>(() => Promise.reject(offline))
    render(<App wiring={wiringOf(gatewayOf(probe))} />)

    await waitFor(() => {
      expect(
        screen.getByText(/could not reach your deployment/i)
      ).toBeInTheDocument()
    })
    expect(screen.queryByRole("banner")).not.toBeInTheDocument()

    probe.mockImplementation(() => Promise.resolve({ capabilities: [] }))
    fireEvent.click(screen.getByRole("button", { name: /^retry$/i }))

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
  })
})

