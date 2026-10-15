import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { browserLocation } from "./site-sign-in"
import {
  callOf,
  renderSites,
  routeOf,
  signInCallback,
  signInRoutes,
} from "./sites-fixtures"

/** The S256 challenge of the verifier `verifier`: 43 base64url characters. */
const CHALLENGE = "iMnq5o6zALKXGivsnlom_0F5_WYda32GHkxlV7mq7hQ"

function consentPath(siteId: string): string {
  return `/sites/${siteId}/sign-in?challenge=${CHALLENGE}&return=%2Fnotes%2Fplan`
}

describe("the consent page of a site sign-in", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows_site_hostname_and_capabilities", async () => {
    renderSites({ path: consentPath("blog"), respond: signInRoutes })

    expect(await screen.findByText("blog.example.org")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Sign in to blog" })
    ).toBeInTheDocument()
    expect(screen.getByText("pages.read")).toBeInTheDocument()
    expect(screen.getByText("draft.read")).toBeInTheDocument()
  })

  it("confirm_requests_code_and_redirects_to_callback", async () => {
    const leave = vi
      .spyOn(browserLocation, "replace")
      .mockImplementation(() => undefined)
    const calls = renderSites({
      path: consentPath("blog"),
      respond: signInRoutes,
    })
    await waitFor(() =>
      expect(calls.map(routeOf)).toContain("GET /v1/sites/blog/manifest")
    )

    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in to blog" })
    )

    const route = "POST /v1/sites/blog/sign-in-codes"
    await waitFor(() => expect(callOf(calls, route)).toBeDefined())
    expect(callOf(calls, route)?.body).toEqual({
      challenge: CHALLENGE,
      return_path: "/notes/plan",
    })
    await waitFor(() => expect(leave).toHaveBeenCalledWith(signInCallback))
    expect(leave).toHaveBeenCalledTimes(1)
  })

  it("unapproved_site_links_to_approval", async () => {
    const calls = renderSites({
      path: consentPath("drafts"),
      respond: signInRoutes,
    })

    expect(
      await screen.findByRole("link", { name: "Approve the site" })
    ).toHaveAttribute("href", "/sites/drafts")
    expect(
      screen.queryByRole("button", { name: "Sign in to drafts" })
    ).not.toBeInTheDocument()
    expect(calls.map(routeOf)).not.toContain(
      "POST /v1/sites/drafts/sign-in-codes"
    )
  })
})
