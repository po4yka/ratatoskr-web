import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import {
  callOf,
  digest,
  releaseRoutes,
  renderSites,
  routeOf,
  siteRoutes,
} from "./sites-fixtures"

const BUILD = "POST /v1/sites/blog/releases"

describe("the release history", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("shows_current_release_and_build_failures", async () => {
    renderSites({
      path: "/sites/blog",
      respond: releaseRoutes({
        current_release_id: digest("a"),
        releases: [
          {
            release_id: digest("a"),
            built_at: "2026-10-14T10:00:00Z",
            page_count: 12,
          },
          {
            release_id: digest("b"),
            built_at: "2026-10-10T10:00:00Z",
            page_count: 9,
          },
        ],
        failed_builds: [
          {
            operation_id: "operation-3",
            failed_at: "2026-10-15T08:00:00Z",
            code: "sites.slug_collision",
            message: "Notes/A B.md and notes/a-b.md have the same slug.",
          },
        ],
      }),
    })

    const current = await screen.findByText("Current release")
    const item = within(current.closest("li") as HTMLElement)
    expect(item.getByText(digest("a"))).toBeInTheDocument()
    expect(item.getByText("12 pages")).toBeInTheDocument()
    expect(screen.getByText(digest("b"))).toBeInTheDocument()
    expect(
      screen.getByText(
        "Two selected files have the same slug. Give one of them a slug in its frontmatter, or exclude one of them."
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText("Notes/A B.md and notes/a-b.md have the same slug.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Build a new release" })
    ).toBeInTheDocument()
  })

  it("first_release_is_requested_explicitly", async () => {
    const calls = renderSites({
      path: "/sites/blog",
      respond: releaseRoutes({
        current_release_id: null,
        releases: [],
        failed_builds: [],
      }),
    })

    expect(
      await screen.findByText(
        "This site has no release. The first release is built only when you request it."
      )
    ).toBeInTheDocument()
    expect(calls.map(routeOf)).not.toContain(BUILD)

    fireEvent.click(
      screen.getByRole("button", { name: "Build the first release" })
    )

    await waitFor(() => expect(callOf(calls, BUILD)).toBeDefined())
    const key = new Headers(callOf(calls, BUILD)?.headers).get(
      "idempotency-key"
    )
    expect(key?.length).toBeGreaterThan(0)
    expect(callOf(calls, BUILD)?.body).toBeUndefined()
    expect(calls.filter((call) => routeOf(call) === BUILD)).toHaveLength(1)
  })

  it("unapproved_site_cannot_start_a_release", async () => {
    const calls = renderSites({
      path: "/sites/drafts",
      respond: (request) =>
        request.path === "/v1/sites/drafts/releases"
          ? { current_release_id: null, releases: [], failed_builds: [] }
          : siteRoutes(request),
    })

    expect(
      await screen.findByText("Approve the site before the first release.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Build the first release" })
    ).toBeDisabled()
    expect(calls.map(routeOf)).not.toContain("POST /v1/sites/drafts/releases")
  })
})
