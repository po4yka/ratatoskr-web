import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { GatewayRequest } from "@/api/gateway/client"
import {
  connectAccepted as accepted,
  connectOperation,
  renderNotes,
} from "./notes-fixtures"

const SECRETS = {
  password: "marker-password-7f3a",
  mfa: "550017",
  e2e: "marker-e2e-91bc",
}

function isConnect(request: GatewayRequest): boolean {
  return request.path === "/v1/notes/connections" && request.method === "POST"
}

function answer(onConnect: () => unknown) {
  return (request: GatewayRequest): unknown => {
    if (isConnect(request)) return onConnect()
    if (request.path === "/v1/notes/connections") return { connections: [] }
    if (request.path === "/v1/operations/operation-1")
      return connectOperation("running", "first_sync")
    return undefined
  }
}

async function openForm() {
  await screen.findByRole("heading", {
    name: /connect a vault with obsidian sync/i,
  })
}

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillForm() {
  fill(/remote vault id/i, "vault-abc")
  fill(/vault name/i, "Research")
  fill(/obsidian email/i, "owner@example.test")
  fill(/obsidian password/i, SECRETS.password)
  fill(/mfa code/i, SECRETS.mfa)
  fireEvent.click(
    screen.getByRole("checkbox", { name: /server can read every file/i })
  )
  fill(/end-to-end encryption password/i, SECRETS.e2e)
}

function storedText(): string {
  const read = (storage: Storage) =>
    Object.keys(storage)
      .map((key) => `${key}=${storage.getItem(key) ?? ""}`)
      .join(";")
  return `${read(localStorage)}|${read(sessionStorage)}`
}

function holdsSecret(text: string): boolean {
  return Object.values(SECRETS).some((secret) => text.includes(secret))
}

const consoleMethods = ["log", "info", "warn", "error", "debug"] as const

describe("the notes connect flow", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("the end-to-end password is asked only after the server-access notice is accepted", async () => {
    renderNotes({ path: "/notes", respond: answer(() => accepted) })
    await openForm()

    expect(
      screen.queryByLabelText(/end-to-end encryption password/i)
    ).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("checkbox", { name: /server can read every file/i })
    )

    expect(
      screen.getByLabelText(/end-to-end encryption password/i)
    ).toBeInTheDocument()
  })

  it("the typed secrets are sent once and kept nowhere after submit", async () => {
    const spies = consoleMethods.map((method) => vi.spyOn(console, method))
    const calls = renderNotes({
      path: "/notes",
      respond: answer(() => accepted),
    })
    await openForm()
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /connect vault/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/obsidian password/i)).toHaveValue("")
    )
    const connects = calls.filter(isConnect)
    expect(connects).toHaveLength(1)
    expect(connects[0]?.body).toEqual({
      channel: "sync",
      vault_key: "vault-abc",
      vault_display_name: "Research",
      sync_login: {
        email: "owner@example.test",
        password: SECRETS.password,
        mfa_code: SECRETS.mfa,
        e2e_password: SECRETS.e2e,
      },
    })
    expect(
      holdsSecret(JSON.stringify(calls.filter((c) => !isConnect(c))))
    ).toBe(false)
    expect(screen.getByLabelText(/mfa code/i)).toHaveValue("")
    expect(holdsSecret(document.body.innerHTML)).toBe(false)
    expect(holdsSecret(storedText())).toBe(false)
    expect(holdsSecret(window.location.href)).toBe(false)
    for (const spy of spies)
      expect(holdsSecret(JSON.stringify(spy.mock.calls))).toBe(false)
  })

  it("the connect operation shows its stage", async () => {
    renderNotes({ path: "/notes", respond: answer(() => accepted) })
    await openForm()
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /connect vault/i }))

    expect(await screen.findByText(/first sync/i)).toBeInTheDocument()
  })

  it("a failed login names its reason", async () => {
    renderNotes({
      path: "/notes",
      respond: answer(() => {
        throw {
          kind: "invalid",
          status: 422,
          code: "notes.sync.e2e_password_wrong",
          message: "The end-to-end password is wrong.",
        }
      }),
    })
    await openForm()
    fillForm()
    fireEvent.click(screen.getByRole("button", { name: /connect vault/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /end-to-end encryption password is wrong/i
    )
    expect(screen.getByLabelText(/obsidian password/i)).toHaveValue("")
  })

  it("a connect without the accepted notice is not sent", async () => {
    const calls = renderNotes({
      path: "/notes",
      respond: answer(() => accepted),
    })
    await openForm()
    fill(/remote vault id/i, "vault-abc")
    fill(/vault name/i, "Research")
    fill(/obsidian email/i, "owner@example.test")
    fill(/obsidian password/i, SECRETS.password)
    fireEvent.click(screen.getByRole("button", { name: /connect vault/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/notice/i)
    expect(calls.filter(isConnect)).toHaveLength(0)
  })
})
