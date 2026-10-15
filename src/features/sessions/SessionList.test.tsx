import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { callOf, routeOf } from "@/features/sites/sites-fixtures"
import { GARDEN, renderSessions } from "./sessions-fixtures"

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
