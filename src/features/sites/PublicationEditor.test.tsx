import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import {
  callOf,
  publicationRoutes,
  publicationRoutesIn,
  renderSites,
} from "./sites-fixtures"

const SAVE = "PUT /v1/sites/blog/publications/notes"

async function editor() {
  return within(await screen.findByRole("form", { name: "Publication notes" }))
}

function type(field: HTMLElement, value: string) {
  fireEvent.change(field, { target: { value } })
}

describe("the publication editor", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("saves_folders_tags_mode_and_release_mode", async () => {
    const calls = renderSites({
      path: "/sites/blog",
      respond: publicationRoutes,
    })
    const form = await editor()

    await waitFor(() =>
      expect(form.getByLabelText("Included folders")).toHaveValue("blog")
    )
    fireEvent.change(form.getByLabelText("Vault connection"), {
      target: { value: "connection-2" },
    })
    type(form.getByLabelText("Included folders"), "blog\n essays/2026 \n\n")
    type(form.getByLabelText("Excluded folders"), "blog/private")
    type(form.getByLabelText("Included tags"), "public")
    fireEvent.click(form.getByRole("radio", { name: /all markdown files/i }))
    fireEvent.click(form.getByRole("radio", { name: /manual/i }))
    fireEvent.click(form.getByRole("button", { name: "Save the publication" }))

    await waitFor(() => expect(callOf(calls, SAVE)).toBeDefined())
    expect(callOf(calls, SAVE)?.body).toEqual({
      connection_id: "connection-2",
      mode: "all",
      release_mode: "manual",
      included_folders: ["blog", "essays/2026"],
      excluded_folders: ["blog/private"],
      included_tags: ["public"],
      frontmatter_allow: ["summary"],
    })
  })

  it("frontmatter_allowlist_extends_the_default", async () => {
    const calls = renderSites({
      path: "/sites/blog",
      respond: publicationRoutes,
    })
    const form = await editor()

    for (const name of [
      "title",
      "description",
      "tags",
      "aliases",
      "date",
      "updated",
      "cover",
    ])
      expect(form.getByText(name)).toBeInTheDocument()
    await waitFor(() =>
      expect(form.getByLabelText("More frontmatter fields")).toHaveValue(
        "summary"
      )
    )
    type(form.getByLabelText("More frontmatter fields"), "summary\nseries")
    fireEvent.click(form.getByRole("button", { name: "Save the publication" }))

    await waitFor(() => expect(callOf(calls, SAVE)).toBeDefined())
    expect(callOf(calls, SAVE)?.body).toMatchObject({
      frontmatter_allow: ["summary", "series"],
    })
  })

  it("shows_the_publication_state", async () => {
    renderSites({
      path: "/sites/blog",
      respond: publicationRoutesIn("suspended"),
    })
    const suspended = await editor()

    expect(suspended.getByText("Suspended")).toBeInTheDocument()
    expect(
      suspended.getByText(
        "The vault connection of this publication was removed. A new release fails until you select a vault connection and save the publication. The current release keeps its pages."
      )
    ).toBeInTheDocument()

    cleanup()
    renderSites({ path: "/sites/blog", respond: publicationRoutes })
    const active = await editor()

    expect(active.getByText("Active")).toBeInTheDocument()
    expect(
      active.queryByText(/vault connection of this publication was removed/)
    ).not.toBeInTheDocument()
  })
})
