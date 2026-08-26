import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { RouteModules } from "@/app/router"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

describe("document reader route", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("opens a result at its document reader route", async () => {
    storeCustody("credential-1")
    const routeModules = {
      reader: () =>
        Promise.resolve({ default: () => <h1>Reader fixture arrived</h1> }),
    } as RouteModules
    renderApp({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
      routeModules,
    })

    fireEvent.click(await screen.findByRole("link", { name: /document ir/i }))

    expect(
      await screen.findByRole("heading", { name: /reader fixture arrived/i })
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe("/documents/document-ir")
  })

  it("opens the protected tags fixture route", async () => {
    window.history.replaceState(null, "", "/tags")
    storeCustody("credential-1")
    const routeModules = {
      tags: () =>
        Promise.resolve({ default: () => <h1>Tags fixture arrived</h1> }),
    } as RouteModules
    renderApp({
      gateway: gatewayOf(() => Promise.resolve({ capabilities: [] })),
      routeModules,
    })

    expect(
      await screen.findByRole("heading", { name: /tags fixture arrived/i })
    ).toBeInTheDocument()
  })
})
