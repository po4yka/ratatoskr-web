import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { browserLocation } from "./site-sign-in"
import {
  callOf,
  renderSites,
  routeOf,
  signInCallback,
  signInRoutes,
  signInRoutesTo,
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

  it("pending_manifest_offers_no_sign_in", async () => {
    const calls = renderSites({
      path: consentPath("garden"),
      respond: signInRoutes,
    })
    await screen.findByRole("heading", { name: "Sign in to garden" })
    await waitFor(() =>
      expect(screen.queryByText("Loading the site")).not.toBeInTheDocument()
    )

    expect(
      screen.queryByRole("button", { name: "Sign in to garden" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Approve the new manifest" })
    ).toHaveAttribute("href", "/sites/garden")
    expect(calls.map(routeOf)).not.toContain(
      "POST /v1/sites/garden/sign-in-codes"
    )
  })

  it("unapproved_site_links_to_approval_when_the_manifest_fails", async () => {
    renderSites({
      path: consentPath("drafts"),
      respond: (request) => {
        if (request.path === "/v1/sites/drafts/manifest")
          throw { kind: "terminal", status: 503 }
        return signInRoutes(request)
      },
    })

    expect(
      await screen.findByRole("link", { name: "Approve the site" })
    ).toHaveAttribute("href", "/sites/drafts")
    expect(
      screen.queryByRole("button", { name: "Sign in to drafts" })
    ).not.toBeInTheDocument()
  })
})

describe("the callback address of the consent page", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("refused_hostname_is_not_followed", async () => {
    const leave = vi
      .spyOn(browserLocation, "replace")
      .mockImplementation(() => undefined)
    renderSites({
      path: consentPath("blog"),
      respond: signInRoutesTo(
        "https://evil.example/.ratatoskr/sign-in/?code=code-1"
      ),
    })

    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in to blog" })
    )

    expect(
      await screen.findByText(
        "The server gave a sign-in address on another host. Ratatoskr did not go there."
      )
    ).toBeInTheDocument()
    expect(leave).not.toHaveBeenCalled()
  })

  it("callback_is_followed_in_its_parsed_form", async () => {
    const leave = vi
      .spyOn(browserLocation, "replace")
      .mockImplementation(() => undefined)
    renderSites({
      path: consentPath("blog"),
      respond: signInRoutesTo(
        "https://BLOG.example.org/.ratatoskr/sign-in/?code=code-1"
      ),
    })

    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in to blog" })
    )

    await waitFor(() => expect(leave).toHaveBeenCalledTimes(1))
    expect(leave).toHaveBeenCalledWith(signInCallback)
  })
})
