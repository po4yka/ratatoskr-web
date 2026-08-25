import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import { readCustody, storeCustody } from "@/auth/custody"
import {
  createPresentedCredentialProvider,
  type PresentedCredentialProvider,
} from "@/auth/provider"
import type { SessionWiring } from "@/auth/session-gateway"
import App from "@/App"

function gatewayOf(run: (request: GatewayRequest) => Promise<unknown>): Gateway {
  return {
    request: run as unknown as Gateway["request"],
  }
}

const accepting: Gateway = gatewayOf(() =>
  Promise.resolve({ capabilities: [] })
)

function wiringWithSpiedRevoke(): SessionWiring {
  const real: PresentedCredentialProvider =
    createPresentedCredentialProvider({ gateway: accepting })
  const provider: PresentedCredentialProvider = {
    ...real,
    revoke: vi.fn(real.revoke.bind(real)),
  }

  return { gateway: accepting, provider }
}

async function renderSignedIn() {
  storeCustody("credential-1")
  const wiring = wiringWithSpiedRevoke()
  render(<App wiring={wiring} />)

  await waitFor(() => {
    expect(screen.getByRole("banner")).toBeInTheDocument()
  })

  return wiring
}

describe("the sign-out flow", () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("revokes through the provider exactly once, discards custody, and lands signed out", async () => {
    const wiring = await renderSignedIn()

    fireEvent.click(screen.getByRole("button", { name: /account/i }))
    fireEvent.click(await screen.findByRole("menuitem", { name: /sign out/i }))
    fireEvent.click(
      await screen.findByRole("button", {
        name: /end the session on this device/i,
      })
    )

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to ratatoskr/i })
      ).toBeInTheDocument()
    })
    expect(wiring.provider.revoke).toHaveBeenCalledTimes(1)
    expect(readCustody()).toBeNull()
  })

  it("confirms first and claims only what the client performs", async () => {
    await renderSignedIn()

    fireEvent.click(screen.getByRole("button", { name: /account/i }))
    fireEvent.click(await screen.findByRole("menuitem", { name: /sign out/i }))

    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent(/ends the session on this device/i)
    // The contract defines no revocation endpoint in this version; the copy
    // must not claim a server-side revoke the client cannot perform.
    expect(dialog).not.toHaveTextContent(/server|platform has revoked/i)
    expect(
      screen.getByRole("button", { name: /end the session on this device/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/^stay signed in$/i)).toBeInTheDocument()
  })
})
