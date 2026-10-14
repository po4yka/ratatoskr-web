import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { GatewayRequest } from "@/api/gateway/client"
import { renderNotes } from "./notes-fixtures"

const connections = {
  connections: [
    {
      connection_id: "connection-1",
      channel: "sync",
      vault_display_name: "Research",
      state: "active",
    },
    {
      connection_id: "connection-2",
      channel: "plugin",
      vault_display_name: "Journal",
      state: "login_expired",
    },
  ],
}

const PLAN = "Projects%2FPlan.md"

function browse(request: GatewayRequest): unknown {
  switch (request.path) {
    case "/v1/notes/connections":
      return connections
    case "/v1/notes/connections/connection-1/files":
      return {
        files: [
          { path: "Projects/Plan.md", revision: "sha256:aa" },
          { path: "Inbox.md", revision: "sha256:bb" },
        ],
        next_cursor: null,
      }
    case `/v1/notes/connections/connection-1/files/${PLAN}`:
      return {
        path: "Projects/Plan.md",
        revision: "sha256:aa",
        content: "# Plan\nShip the reader first.",
      }
    case `/v1/notes/connections/connection-1/index/${PLAN}`:
      return {
        path: "Projects/Plan.md",
        revision: "sha256:aa",
        backlinks: [{ path: "Inbox.md" }],
      }
    default:
      return undefined
  }
}

describe("the notes vault browse", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("lists the connections with their channel and state", async () => {
    renderNotes({ path: "/notes", respond: browse })

    expect(
      await screen.findByRole("link", { name: "Research" })
    ).toHaveAttribute("href", "/notes/connection-1")
    const journal = screen.getByRole("listitem", { name: /journal/i })
    expect(journal).toHaveTextContent(/plugin/i)
    expect(journal).toHaveTextContent(/login expired/i)
  })

  it("an empty list says that no vault is connected", async () => {
    renderNotes({
      path: "/notes",
      respond: (request) =>
        request.path === "/v1/notes/connections"
          ? { connections: [] }
          : undefined,
    })

    expect(
      await screen.findByText(/no vault is connected/i)
    ).toBeInTheDocument()
  })

  it("a list that cannot load is an error, not an empty list", async () => {
    renderNotes({
      path: "/notes",
      respond: () => {
        throw {
          kind: "terminal",
          status: 503,
          code: "notes.service.unavailable",
        }
      },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /notes service is not available/i
    )
    expect(screen.queryByText(/no vault is connected/i)).not.toBeInTheDocument()
  })

  it("a file shows its text and its backlinks and cannot be edited", async () => {
    renderNotes({ path: "/notes/connection-1", respond: browse })

    fireEvent.click(
      await screen.findByRole("link", { name: "Projects/Plan.md" })
    )

    expect(
      await screen.findByText(/ship the reader first/i)
    ).toBeInTheDocument()
    const backlinks = await screen.findByRole("region", { name: /backlinks/i })
    expect(
      within(backlinks).getByRole("link", { name: "Inbox.md" })
    ).toBeInTheDocument()
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
  })

  it("a disconnect is sent only after a confirmation that names the vault", async () => {
    const calls = renderNotes({ path: "/notes", respond: browse })
    const isDelete = (request: GatewayRequest) => request.method === "DELETE"

    fireEvent.click(
      await screen.findByRole("button", { name: /disconnect research/i })
    )
    const dialog = await screen.findByRole("alertdialog", {
      name: /disconnect research/i,
    })
    expect(calls.filter(isDelete)).toHaveLength(0)

    fireEvent.click(
      within(dialog).getByRole("button", { name: /disconnect vault/i })
    )
    await waitFor(() =>
      expect(calls.filter(isDelete).map((call) => call.path)).toEqual([
        "/v1/notes/connections/connection-1",
      ])
    )
  })

  it("the route explains its absence when the deployment lacks notes.vaults", async () => {
    renderNotes({ path: "/notes", respond: browse, capabilities: [] })

    expect(
      await screen.findByRole("heading", {
        name: /not available in this deployment/i,
      })
    ).toBeInTheDocument()
  })
})
