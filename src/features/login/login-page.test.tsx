import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMemoryRouter } from "react-router"
import { RouterProvider } from "react-router/dom"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import type { ApiOfflineError, HttpApiError } from "@/api/gateway/errors"
import { readCustody } from "@/auth/custody"
import { createPresentedCredentialProvider } from "@/auth/provider"
import type { SessionWiring } from "@/auth/session-gateway"
import { AuthProvider } from "@/auth/auth-context"
import LoginPage from "./login-page"

function gatewayOf(
  run: (request: GatewayRequest) => Promise<unknown>
): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

const offline: ApiOfflineError = { kind: "offline" }
const refused: HttpApiError = { kind: "unauthenticated", status: 401 }

function renderLogin(gateway: Gateway) {
  const wiring: SessionWiring = {
    gateway,
    provider: createPresentedCredentialProvider({ gateway }),
  }

  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "*", element: <p>protected region</p> },
    ],
    { initialEntries: ["/login"] }
  )

  return render(
    <AuthProvider wiring={wiring}>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

function submitCredential(credential: string) {
  fireEvent.change(screen.getByLabelText(/platform credential/i), {
    target: { value: credential },
  })
  fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }))
}

describe("the sign-in form", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("signs the user in when Platform accepts the presented credential", async () => {
    renderLogin(gatewayOf(() => Promise.resolve({ capabilities: [] })))

    submitCredential("good-credential")

    await waitFor(() => {
      // The context flips to authenticated; the login surface announces it
      // is no longer the place to be rather than leaving the form up.
      expect(screen.queryByRole("button", { name: /^sign in$/i })).toBeNull()
    })
    expect(readCustody()).toBe("good-credential")
  })

  it("refuses an unusable credential without taking custody and says why", async () => {
    renderLogin(gatewayOf(() => Promise.reject(refused)))

    submitCredential("wrong-credential")

    const notice = await screen.findByRole("alert")
    expect(notice).toHaveTextContent(/was not accepted/i)
    expect(readCustody()).toBeNull()
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeEnabled()
  })

  it("renders an unreachable backend as retryable, distinct from a refusal", async () => {
    const probe = vi.fn<() => Promise<unknown>>(() => Promise.reject(offline))
    renderLogin(gatewayOf(probe))

    submitCredential("whatever-credential")

    const notice = await screen.findByRole("alert")
    expect(notice).toHaveTextContent(/could not be reached/i)
    expect(readCustody()).toBeNull()

    probe.mockImplementation(() => Promise.resolve({ capabilities: [] }))
    fireEvent.click(screen.getByRole("button", { name: /^try again$/i }))
    fireEvent.change(screen.getByLabelText(/platform credential/i), {
      target: { value: "retried-credential" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^sign in$/i }))

    await waitFor(() => {
      expect(readCustody()).toBe("retried-credential")
    })
  })

  it("does not submit while a sign-in attempt is in flight", async () => {
    let release!: (payload: unknown) => void
    const pending = new Promise((resolve) => {
      release = resolve
    })
    renderLogin(gatewayOf(() => pending))

    submitCredential("in-flight-credential")
    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled()

    release({ capabilities: [] })
    await waitFor(() => {
      expect(readCustody()).toBe("in-flight-credential")
    })
  })
})
