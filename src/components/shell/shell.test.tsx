import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { HttpApiError } from "@/api/gateway/errors"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

const refused: HttpApiError = { kind: "unauthenticated", status: 401 }

describe("the protected shell gate", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("returns the user to the URL they asked for after signing in", async () => {
    // Signed out, deep-linked into a protected route.
    window.history.replaceState(null, "", "/collections")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
    })

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
    renderApp({ gateway: gatewayOf(() => Promise.reject(refused)) })

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in to ratatoskr/i })
      ).toBeInTheDocument()
    })
    expect(screen.queryByText(/collections arrive/i)).not.toBeInTheDocument()
  })
})

const accepting = () => Promise.resolve({ capabilities: [] })

async function renderAuthenticatedShell() {
  storeCustody("credential-1")
  renderApp({ gateway: gatewayOf(accepting) })

  await waitFor(() => {
    expect(screen.getByRole("banner")).toBeInTheDocument()
  })
}

describe("the shell surface", () => {
  beforeEach(() => {
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
    localStorage.clear()
  })

  it("exposes a skip link that targets the main region", async () => {
    await renderAuthenticatedShell()

    const skipLink = screen.getByRole("link", { name: /skip to content/i })
    expect(skipLink).toHaveAttribute("href", "#main")

    const main = screen.getByRole("main")
    expect(main).toHaveAttribute("id", "main")
  })

  it("carries the navigation landmarks", async () => {
    await renderAuthenticatedShell()

    expect(
      screen.getByRole("navigation", { name: /primary/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("banner")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })

  it("offers light, dark, and system in the theme switcher and persists the choice", async () => {
    await renderAuthenticatedShell()

    const darkButton = screen.getByRole("button", { name: /^dark$/i })
    expect(screen.getByRole("button", { name: /^light$/i })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^system$/i })
    ).toBeInTheDocument()
    expect(darkButton).toHaveAttribute("aria-pressed", "false")

    fireEvent.click(darkButton)

    expect(document.documentElement).toHaveClass("dark")
    expect(localStorage.getItem("theme")).toBe("dark")
    expect(darkButton).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /^light$/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("reaches sign-out from the keyboard and confirms before revoking", async () => {
    await renderAuthenticatedShell()

    // A pointer-less user must reach the account menu by keyboard alone.
    const trigger = screen.getByRole("button", { name: /account/i })
    trigger.focus()
    expect(trigger).toHaveFocus()

    fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" })
    fireEvent.keyUp(trigger, { key: "Enter", code: "Enter" })
    // jsdom does not synthesize the native button click that follows Enter.
    fireEvent.click(trigger, { detail: 0 })

    const signOut = await screen.findByRole("menuitem", { name: /sign out/i })
    fireEvent.click(signOut)

    // Confirmation names the consequence before anything is revoked.
    const confirm = await screen.findByRole("button", {
      name: /end the session on this device/i,
    })
    expect(confirm).toBeInTheDocument()
  })
})
