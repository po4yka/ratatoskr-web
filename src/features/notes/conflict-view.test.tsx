import { cleanup, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { renderNotes } from "./notes-fixtures"
import { conflicts } from "./write-fixtures"

describe("the conflict view", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("offers accept_merge only with a proposal", async () => {
    renderNotes({ path: "/notes/conflicts/conflict-1", respond: conflicts })

    const choices = await screen.findByRole("radiogroup", {
      name: /resolve the conflict/i,
    })
    expect(choices).toHaveTextContent(/keep the vault version/i)
    expect(
      screen.getByRole("radio", { name: /accept the merge/i })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/the vault added this line/i, { selector: "pre" })
    ).not.toHaveLength(0)

    cleanup()
    renderNotes({ path: "/notes/conflicts/conflict-2", respond: conflicts })

    await screen.findByRole("radiogroup", { name: /resolve the conflict/i })
    expect(
      screen.getByRole("radio", { name: /keep the vault version/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("radio", { name: /keep your version/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("radio", { name: /accept the merge/i })
    ).not.toBeInTheDocument()
  })

  it("says that the vault applied only a part of the change", async () => {
    renderNotes({ path: "/notes/conflicts/conflict-4", respond: conflicts })

    await screen.findByRole("radiogroup", { name: /resolve the conflict/i })
    expect(
      await screen.findByText(
        "The vault applied only a part of the rename and its link updates. Resolve the conflict to finish the change."
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/the vault changed this file after you opened it/i)
    ).not.toBeInTheDocument()
  })

  it("lists the stale paths of a write group", async () => {
    renderNotes({ path: "/notes/conflicts/conflict-4", respond: conflicts })

    const files = await screen.findByRole("list", {
      name: "Files of the change",
    })
    const links = within(files).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "Projects/Notes.md",
      "Projects/Plan.md",
    ])
    expect(links[1]).toHaveAttribute(
      "href",
      "/notes/connection-1?file=Projects%2FPlan.md"
    )
  })

  it("says that a side over the limit is too large to show", async () => {
    renderNotes({ path: "/notes/conflicts/conflict-3", respond: conflicts })

    await screen.findByRole("radiogroup", { name: /resolve the conflict/i })
    const current = screen.getByRole("region", { name: /vault version/i })
    expect(current).toHaveTextContent(/too large to show/i)
    const writer = screen.getByRole("region", { name: /your version/i })
    expect(writer).toHaveTextContent(/too large to show/i)
    expect(
      screen.getByRole("radio", { name: /type the content/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("radio", { name: /accept the merge/i })
    ).not.toBeInTheDocument()
  })
})
