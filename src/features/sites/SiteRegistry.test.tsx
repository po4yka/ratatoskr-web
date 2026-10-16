import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import {
  activeManifest,
  callOf,
  renderSites,
  routeOf,
  siteRoutes,
} from "./sites-fixtures"

function row(name: string) {
  return within(screen.getByRole("listitem", { name }))
}

describe("the site registry", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("lists_sites_with_manifest_state", async () => {
    renderSites({ path: "/sites", respond: siteRoutes })

    expect(await screen.findByRole("link", { name: "blog" })).toHaveAttribute(
      "href",
      "/sites/blog"
    )
    expect(row("blog").getByText("Approved")).toBeInTheDocument()
    expect(row("drafts").getByText("Not approved")).toBeInTheDocument()
    expect(row("archive").getByText("Withdrawn")).toBeInTheDocument()
    expect(row("garden").getByText("Approved")).toBeInTheDocument()
    expect(
      row("garden").getByText("A new manifest waits for approval.")
    ).toBeInTheDocument()
    expect(
      row("blog").queryByText("A new manifest waits for approval.")
    ).not.toBeInTheDocument()
  })

  it("approve_sends_the_active_manifest_digest", async () => {
    const calls = renderSites({ path: "/sites/drafts", respond: siteRoutes })
    await waitFor(() =>
      expect(calls.map(routeOf)).toContain("GET /v1/sites/drafts/manifest")
    )

    fireEvent.click(
      await screen.findByRole("button", { name: "Approve this manifest" })
    )

    const route = "POST /v1/sites/drafts/manifest/approval"
    await waitFor(() => expect(callOf(calls, route)).toBeDefined())
    expect(callOf(calls, route)?.body).toEqual({
      manifest_sha256: activeManifest("drafts").manifest_sha256,
    })
  })

  it("shows the approved repository name and immutable id", async () => {
    renderSites({
      path: "/sites/drafts",
      respond: (request) =>
        routeOf(request) === "GET /v1/sites/drafts/manifest"
          ? {
              ...activeManifest("drafts"),
              github_repository: {
                repository: "owner/docs-site",
                repository_id: "1420131953",
              },
            }
          : siteRoutes(request),
    })
    expect(await screen.findByText("owner/docs-site")).toBeInTheDocument()
    expect(screen.getByText("1420131953")).toBeInTheDocument()
  })

  it("requires a repository binding before a new approval", async () => {
    renderSites({
      path: "/sites/drafts",
      respond: (request) =>
        routeOf(request) === "GET /v1/sites/drafts/manifest"
          ? { ...activeManifest("drafts"), github_repository: null }
          : siteRoutes(request),
    })
    expect(
      await screen.findByRole("button", { name: "Approve this manifest" })
    ).toBeDisabled()
  })

  it("withdraw_calls_delete_approval", async () => {
    const calls = renderSites({ path: "/sites/blog", respond: siteRoutes })
    await waitFor(() =>
      expect(calls.map(routeOf)).toContain("GET /v1/sites/blog/manifest")
    )

    fireEvent.click(
      await screen.findByRole("button", { name: "Withdraw the approval" })
    )
    fireEvent.click(
      await screen.findByRole("button", { name: "Withdraw approval" })
    )

    const route = "DELETE /v1/sites/blog/manifest/approval"
    await waitFor(() => expect(callOf(calls, route)).toBeDefined())
    expect(callOf(calls, route)?.body).toBeUndefined()
  })
})
