import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ApiOfflineError } from "@/api/gateway/errors"
import { gatewayOf, renderApp } from "@/test/app-harness"
import { storeCustody } from "./custody"

const offline: ApiOfflineError = { kind: "offline" }

describe("the application boot sequence", () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("renders a designed pending state while the session question is open", () => {
    renderApp({ gateway: gatewayOf(() => new Promise(() => {})) })

    expect(screen.getByRole("status")).toHaveTextContent(
      /checking your session/i
    )
    expect(screen.queryByRole("banner")).not.toBeInTheDocument()
  })

  it("renders the protected shell when boot resolves authenticated", async () => {
    storeCustody("credential-1")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

    await waitFor(() => {
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
    expect(screen.getByRole("navigation")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })

  it("renders the unauthorized surface when boot resolves unauthenticated", async () => {
    renderApp({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

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
    renderApp({ gateway: gatewayOf(probe) })

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
