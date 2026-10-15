import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { Gateway, GatewayRequest } from "@/api/gateway/client"
import { browse, fileBytes } from "./browse-fixtures"
import { renderNotes } from "./notes-fixtures"
import { notesSource } from "./notes-source"

const VAULT = "/v1/notes/connections/connection-1/"
const FILE_LIST = "/v1/notes/connections/connection-1/files"

/** Paths with an empty, `.` or `..` segment, also percent-encoded. */
const NOT_VAULT_PATHS = [
  "",
  ".",
  "..",
  "../../../../v1/other/route",
  "Projects/../Inbox.md",
  "./Inbox.md",
  "%2e%2e/v1/other/route",
  "%2E%2E/v1/other/route",
  "%2e/Inbox.md",
  "/Inbox.md",
  "Inbox.md/",
  "Projects//Plan.md",
]

/** A gateway double that records each request and answers nothing. */
function recordingGateway(calls: GatewayRequest[]): Gateway {
  return {
    request: async (request) => {
      calls.push(request)
      return undefined
    },
    stream: async (request) => {
      calls.push(request)
      return new ReadableStream({ start: (controller) => controller.close() })
    },
  }
}

/** The requests to this vault other than its file list. */
function fileRequests(calls: readonly GatewayRequest[]): string[] {
  return calls
    .map((call) => call.path)
    .filter((path) => path !== FILE_LIST)
    .filter((path) => path.startsWith(VAULT) || path.includes("/v1/other"))
}

describe("a file path from the address bar", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it.each(NOT_VAULT_PATHS)(
    "the path %j is refused before any request",
    async (path) => {
      const calls: GatewayRequest[] = []
      const source = notesSource(recordingGateway(calls))

      await expect(source.file("connection-1", path)).rejects.toMatchObject({
        code: "notes.file.not_found",
      })
      await expect(source.index("connection-1", path)).rejects.toMatchObject({
        code: "notes.file.not_found",
      })
      expect(calls).toEqual([])
    }
  )

  it.each([
    "..%2F..%2F..%2F..%2Fv1%2Fother%2Froute",
    "%2e%2e%2Fv1%2Fother%2Froute",
    "%252E%252E%2Fv1%2Fother%2Froute",
    "",
    "%2FInbox.md",
    "Inbox.md%2F",
  ])("the address ?file=%s sends no file request", async (query) => {
    const calls = renderNotes({
      path: `/notes/connection-1?file=${query}`,
      respond: browse,
      stream: fileBytes,
    })

    expect(
      await screen.findByText(/does not exist in the vault now/i)
    ).toBeInTheDocument()
    expect(fileRequests(calls)).toEqual([])
  })

  it("a file that is not in the loaded file list sends no file or index request", async () => {
    const calls = renderNotes({
      path: "/notes/connection-1?file=Other.md",
      respond: browse,
      stream: fileBytes,
    })

    expect(
      await screen.findByText(/does not exist in the vault now/i)
    ).toBeInTheDocument()
    expect(fileRequests(calls)).toEqual([])
  })
})
