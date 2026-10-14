import { screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { browse, fileBytes } from "./browse-fixtures"
import { renderNotes } from "./notes-fixtures"

const PLAN = "/notes/connection-1?file=Projects%2FPlan.md"

describe("one file of a vault", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("a file is read by its path segments, from the file and index routes", async () => {
    const calls = renderNotes({
      path: PLAN,
      respond: browse,
      stream: fileBytes,
    })

    expect(
      await screen.findByText(/ship the reader first/i)
    ).toBeInTheDocument()
    const paths = calls.map((call) => call.path)
    expect(paths).toContain(
      "/v1/notes/connections/connection-1/files/Projects/Plan.md"
    )
    expect(paths).toContain(
      "/v1/notes/connections/connection-1/index/Projects/Plan.md"
    )
  })

  it("a file shows its links, tags and properties from the index", async () => {
    renderNotes({ path: PLAN, respond: browse, stream: fileBytes })

    const links = await screen.findByRole("region", { name: /^links$/i })
    expect(
      await within(links).findByRole("link", { name: "Inbox.md" })
    ).toHaveAttribute("href", "/notes/connection-1?file=Inbox.md")
    expect(links).toHaveTextContent(/missing note \(not in the vault\)/i)
    const tags = screen.getByRole("region", { name: /tags/i })
    expect(tags).toHaveTextContent("#plan")
    const properties = screen.getByRole("region", { name: /properties/i })
    expect(properties).toHaveTextContent(/status/i)
    expect(properties).toHaveTextContent(/draft/i)
  })

  it("a file that is not text says so", async () => {
    renderNotes({
      path: PLAN,
      respond: browse,
      stream: () => new Uint8Array([0xff, 0xfe, 0x00, 0x9f]),
    })

    expect(
      await screen.findByText(/this file is not text/i)
    ).toBeInTheDocument()
  })

  it("a file that is gone names the reason", async () => {
    renderNotes({
      path: "/notes/connection-1?file=Gone.md",
      respond: browse,
      stream: fileBytes,
    })

    expect(
      await screen.findByText(/does not exist in the vault now/i)
    ).toBeInTheDocument()
  })
})
