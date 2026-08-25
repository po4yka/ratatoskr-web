import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import type { HttpApiError } from "@/api/gateway/errors"
import { createPresentedCredentialProvider } from "@/auth/provider"
import type { SessionWiring } from "@/auth/session-gateway"
import App from "@/App"

function gatewayOf(run: (request: GatewayRequest) => Promise<unknown>): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

const refused: HttpApiError = { kind: "unauthenticated", status: 401 }

describe("the protected shell gate", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("returns the user to the URL they asked for after signing in", async () => {
    // Signed out, deep-linked into a protected route.
    window.history.replaceState(null, "", "/collections")
    const wiring: SessionWiring = {
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
      provider: null as unknown as SessionWiring["provider"],
    }
    wiring.provider = createPresentedCredentialProvider({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

    render(<App wiring={wiring} />)

    // The shell never renders; the unauthorized surface does.
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to ratatoskr/i })
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/search arrives/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/platform credential/i), {
      target: { value: "good-credential" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /collections/i })
      ).toBeInTheDocument()
    })
    expect(window.location.pathname).toBe("/collections")
  })

  it("keeps refusing direct access while the credential stays unusable", async () => {
    window.history.replaceState(null, "", "/collections")
    const wiring: SessionWiring = {
      gateway: gatewayOf(() => Promise.reject(refused)),
      provider: null as unknown as SessionWiring["provider"],
    }
    wiring.provider = createPresentedCredentialProvider({ gateway: wiring.gateway })

    render(<App wiring={wiring} />)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to ratatoskr/i })
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/collections arrive/i)).not.toBeInTheDocument()
  })
})
