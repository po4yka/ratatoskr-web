import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { NavEntry } from "@/app/navigation"
import type { RouteModules } from "@/app/router"
import { emptyDeployment } from "@/capabilities/capability-fixtures"
import { storeCustody } from "@/auth/custody"
import { gatewayOf, renderApp } from "@/test/app-harness"

const githubRegistry: readonly NavEntry[] = [
  {
    id: "github",
    label: "GitHub",
    path: "/github",
    requires: "github.catalog",
  },
]

const githubModule = { default: () => <p>github catalog arrived</p> }

describe("GitHub capability route", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it("explains a direct GitHub route whose capability is absent", async () => {
    window.history.replaceState(null, "", "/github")
    storeCustody("credential-1")
    renderApp({
      gateway: gatewayOf(() => Promise.resolve(emptyDeployment)),
      navEntries: githubRegistry,
      routeModules: {
        github: () => Promise.resolve(githubModule),
      } as RouteModules,
    })

    expect(
      await screen.findByRole("heading", {
        name: /not available in this deployment/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/github catalog arrived/i)
    ).not.toBeInTheDocument()
  })
})
