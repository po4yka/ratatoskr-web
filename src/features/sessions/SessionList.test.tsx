import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { callOf, routeOf } from "@/features/sites/sites-fixtures"
import {
  GARDEN,
  hangingRevokeRoutes,
  invalidTimeRoutes,
  missingSessionRoutes,
  pagedSessionRoutes,
  renderSessions,
} from "./sessions-fixtures"

async function siteGroup(siteId: string) {
  return within(
    await screen.findByRole("region", { name: `Sessions of ${siteId}` })
  )
}

describe("the session list", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("site_owner_sessions_are_grouped_by_site", async () => {
    renderSessions()

    const blog = await siteGroup("blog")
    expect(blog.getByText("blog.example.org")).toBeInTheDocument()
    expect(blog.getAllByRole("listitem")).toHaveLength(2)
    const garden = await siteGroup("garden")
    expect(garden.getByText("garden.example.org")).toBeInTheDocument()
    expect(garden.getAllByRole("listitem")).toHaveLength(1)
    expect(
      screen.queryByRole("region", { name: /^Sessions of null/ })
    ).not.toBeInTheDocument()
  })

  it("revoke_site_sends_the_site_id", async () => {
    const calls = renderSessions()
    const blog = await siteGroup("blog")

    fireEvent.click(
      blog.getByRole("button", { name: "End all sessions of blog" })
    )
    fireEvent.click(
      await screen.findByRole("button", { name: "End the sessions" })
    )

    const route = "POST /v1/sessions/revoke-site"
    await waitFor(() => expect(callOf(calls, route)).toBeDefined())
    expect(callOf(calls, route)?.body).toEqual({ site_id: "blog" })
  })

  it("revoke_one_site_session_sends_its_id", async () => {
    const calls = renderSessions()
    const garden = await siteGroup("garden")

    fireEvent.click(garden.getByRole("button", { name: "End this session" }))
    fireEvent.click(
      await screen.findByRole("button", { name: "End the session" })
    )

    await waitFor(() =>
      expect(calls.map(routeOf)).toContain(`DELETE /v1/sessions/${GARDEN}`)
    )
    expect(calls.map(routeOf)).not.toContain("POST /v1/sessions/revoke-site")
  })
})

describe("the session list after a revocation", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("revoke_keeps_the_loaded_pages_and_counts", async () => {
    const calls = renderSessions(pagedSessionRoutes)
    const blog = await siteGroup("blog")
    fireEvent.click(screen.getByRole("button", { name: "Load more sessions" }))
    await siteGroup("orchard")

    fireEvent.click(
      blog.getByRole("button", { name: "End all sessions of blog" })
    )
    fireEvent.click(
      await screen.findByRole("button", { name: "End the sessions" })
    )

    expect(
      await screen.findByText("2 sessions of blog ended.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("region", { name: "Sessions of blog" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Sessions of orchard" })
    ).toBeInTheDocument()
    expect(
      calls.filter(
        (call) => call.path === "/v1/sessions" && call.query === undefined
      )
    ).toHaveLength(1)
  })

  it("buttons_wait_while_a_revoke_runs", async () => {
    const calls = renderSessions(hangingRevokeRoutes)
    const blog = await siteGroup("blog")

    fireEvent.click(
      blog.getByRole("button", { name: "End all sessions of blog" })
    )
    fireEvent.click(
      await screen.findByRole("button", { name: "End the sessions" })
    )
    await waitFor(() =>
      expect(calls.map(routeOf)).toContain("POST /v1/sessions/revoke-site")
    )

    expect(
      blog.getByRole("button", { name: "End all sessions of blog" })
    ).toBeDisabled()
    for (const button of blog.getAllByRole("button", {
      name: "End this session",
    }))
      expect(button).toBeDisabled()
  })

  it("an_invalid_time_shows_the_absence", async () => {
    renderSessions(invalidTimeRoutes)
    const garden = await siteGroup("garden")

    expect(
      garden.getByText("Signed in at an unknown time. Last use: not yet.")
    ).toBeInTheDocument()
  })
})

describe("two revocations and the end of a group", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  async function endOne(siteId: string) {
    const group = await siteGroup(siteId)
    fireEvent.click(group.getByRole("button", { name: "End this session" }))
    fireEvent.click(
      await screen.findByRole("button", { name: "End the session" })
    )
  }

  it("two_revocations_keep_their_own_pending", async () => {
    renderSessions(hangingRevokeRoutes)
    const blog = await siteGroup("blog")
    fireEvent.click(
      blog.getByRole("button", { name: "End all sessions of blog" })
    )
    fireEvent.click(
      await screen.findByRole("button", { name: "End the sessions" })
    )

    await endOne("garden")

    expect(await screen.findByText("The session ended.")).toBeInTheDocument()
    expect(
      blog.getByRole("button", { name: "End all sessions of blog" })
    ).toBeDisabled()
  })

  it("focus_moves_to_the_outcome_when_a_group_ends", async () => {
    renderSessions()

    await endOne("garden")

    const outcome = await screen.findByText("The session ended.")
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Sessions of garden" })
      ).not.toBeInTheDocument()
    )
    expect(outcome).toHaveFocus()
  })

  it("not_found_removes_the_session", async () => {
    renderSessions(missingSessionRoutes)

    await endOne("garden")

    expect(
      await screen.findByText(
        "The server does not know this session. It can be ended already."
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("region", { name: "Sessions of garden" })
    ).not.toBeInTheDocument()
  })
})
