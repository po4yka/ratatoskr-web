import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { GatewayRequest } from "@/api/gateway/client"
import {
  connectAccepted,
  connectOperation,
  endedOperation,
  renderNotes,
} from "./notes-fixtures"

/** The text that ratatoskr-notes or Edge put in an envelope. */
const SERVER_TEXT = "Fixed server text."

function isConnect(request: GatewayRequest): boolean {
  return request.path === "/v1/notes/connections" && request.method === "POST"
}

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

/** Submit a filled connect form, and answer the operation read with `operation`. */
async function connectWith(operation: unknown): Promise<GatewayRequest[]> {
  const calls = renderNotes({
    path: "/notes",
    respond: (request) => {
      if (isConnect(request)) return connectAccepted
      if (request.path === "/v1/notes/connections") return { connections: [] }
      if (request.path === "/v1/operations/operation-1") return operation
      return undefined
    },
  })
  await screen.findByRole("heading", {
    name: /connect a vault with obsidian sync/i,
  })
  fill(/remote vault id/i, "vault-abc")
  fill(/vault name/i, "Research")
  fill(/obsidian email/i, "owner@example.test")
  fill(/obsidian password/i, "password")
  fireEvent.click(
    screen.getByRole("checkbox", { name: /server can read every file/i })
  )
  fireEvent.click(screen.getByRole("button", { name: /connect vault/i }))
  return calls
}

describe("the notes connect operation", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("the connect sends no Idempotency-Key and follows the operation that Edge names", async () => {
    const calls = await connectWith(connectOperation("running", "login"))

    await waitFor(() =>
      expect(
        calls.some((call) => call.path === "/v1/operations/operation-1")
      ).toBe(true)
    )
    const headers = Object.keys(calls.find(isConnect)?.headers ?? {})
    expect(headers.map((name) => name.toLowerCase())).not.toContain(
      "idempotency-key"
    )
  })

  it.each([
    ["login", /step 1 of 4: obsidian login/i],
    ["setup", /step 2 of 4: setup of the sync client/i],
    ["first_sync", /step 3 of 4: first sync of the vault/i],
    ["indexing", /step 4 of 4: indexing of the files/i],
  ])("the connect operation names the phase %s", async (phase, text) => {
    await connectWith(connectOperation("running", phase))

    expect(await screen.findByText(text)).toBeInTheDocument()
  })

  it.each([
    ["notes.sync.login_failed", /did not accept the email or the password/i],
    ["notes.sync.mfa_required", /type the mfa code/i],
    ["notes.sync.e2e_password_wrong", /encryption password is wrong/i],
    ["notes.sync.vault_not_found", /no vault with this id/i],
    ["notes.service.unavailable", /notes service is not available/i],
    ["edge.upstream_unavailable", /could not reach the notes service/i],
    ["edge.upstream_timeout", /notes service did not answer in time/i],
    ["edge.upstream_invalid_response", /answer that the server cannot use/i],
    ["platform.operation.stale", /stopped getting the progress/i],
  ])(
    "a failed connect operation names the reason of %s",
    async (code, text) => {
      await connectWith(
        endedOperation("failed", { errors: [{ code, message: SERVER_TEXT }] })
      )

      expect(await screen.findByText(text)).toBeInTheDocument()
    }
  )

  it("a connect that ends with a warning names the warning", async () => {
    await connectWith(
      endedOperation("partially_succeeded", {
        warnings: [
          { code: "notes.sync.journal_unreadable", message: SERVER_TEXT },
        ],
      })
    )

    expect(
      await screen.findByText(/cannot see when the obsidian login expires/i)
    ).toBeInTheDocument()
  })
})
