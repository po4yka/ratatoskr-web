import { createHash } from "node:crypto"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { GatewayRequest } from "@/api/gateway/client"
import { fileBytes } from "./browse-fixtures"
import { renderNotes } from "./notes-fixtures"
import { storedBlob, writeOperation, writes } from "./write-fixtures"

const PLAN = "/notes/connection-1?file=Projects%2FPlan.md"
const CONNECTION = "/v1/notes/connections/connection-1"
const LOADED = "# Plan\nShip the reader first."
const EDITED = "# Plan\nShip the editor first."

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

/** The index of the call `"<METHOD> <path>"` among the recorded calls. */
function indexOf(calls: readonly GatewayRequest[], route: string): number {
  return calls.findIndex((call) => `${call.method} ${call.path}` === route)
}

/** The Idempotency-Key of a call has 1 to 255 characters. */
function expectKey(call: GatewayRequest | undefined) {
  const key = new Headers(call?.headers).get("idempotency-key") ?? ""
  expect(key.length).toBeGreaterThan(0)
  expect(key.length).toBeLessThanOrEqual(255)
}

/** The calls of the upload and the write, in the order they were sent. */
function steps(recorded: readonly GatewayRequest[]) {
  const blobs = `${CONNECTION}/blobs`
  return {
    open: indexOf(recorded, `POST ${blobs}`),
    chunk: indexOf(recorded, `PUT ${blobs}/upload-1/chunks/0`),
    finalize: indexOf(recorded, `POST ${blobs}/upload-1/finalize`),
    write: indexOf(recorded, `POST ${CONNECTION}/writes`),
  }
}

describe("the note editor", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("uploads before it writes and sends the loaded base hash", async () => {
    // The responder reads the list that the render returns, at call time.
    const recorded: GatewayRequest[] = renderNotes({
      path: PLAN,
      respond: (request) => writes(recorded)(request),
      stream: fileBytes,
    })
    await screen.findByText(/ship the reader first/i)

    fireEvent.click(screen.getByRole("button", { name: /edit this note/i }))
    fireEvent.change(screen.getByRole("textbox", { name: /note text/i }), {
      target: { value: EDITED },
    })
    fireEvent.click(screen.getByRole("button", { name: /save the note/i }))

    await waitFor(() => expect(steps(recorded).write).not.toBe(-1))
    const { open, chunk, finalize, write } = steps(recorded)
    expect(open).toBeGreaterThanOrEqual(0)
    expect(chunk).toBeGreaterThan(open)
    expect(finalize).toBeGreaterThan(chunk)
    expect(write).toBeGreaterThan(finalize)

    const length = new TextEncoder().encode(EDITED).length
    expect(recorded[open].body).toMatchObject({
      declared_size_bytes: length,
      digest: { algorithm: "sha256", hex: sha256(EDITED) },
    })
    expect(new TextDecoder().decode(recorded[chunk].bytes)).toBe(EDITED)
    expect(recorded[finalize].body).toEqual({ resumption_token: "upload-1" })
    expect(recorded[write].body).toEqual({
      operation: {
        update: {
          path: "Projects/Plan.md",
          base_hash: sha256(LOADED),
          blob: storedBlob(sha256(EDITED), length),
        },
      },
    })
    expectKey(recorded[write])
  })

  it("write-mode switch sends PUT write-mode", async () => {
    const recorded: GatewayRequest[] = renderNotes({
      path: "/notes/connection-1",
      respond: (request) => writes(recorded)(request),
    })
    const route = `PUT ${CONNECTION}/write-mode`

    fireEvent.click(
      await screen.findByRole("button", { name: /turn write-back on/i })
    )

    await waitFor(() => expect(indexOf(recorded, route)).not.toBe(-1))
    const put = recorded[indexOf(recorded, route)]
    expect(put.body).toEqual({ write_mode: "on" })
    expectKey(put)
  })
  it("save stays disabled while the write operation runs", async () => {
    let status = "running"
    const recorded: GatewayRequest[] = renderNotes({
      path: PLAN,
      respond: (request) =>
        request.path === "/v1/operations/operation-7"
          ? writeOperation("notes.file.write", status)
          : writes(recorded)(request),
      stream: fileBytes,
    })
    await screen.findByText(/ship the reader first/i)
    fireEvent.click(screen.getByRole("button", { name: /edit this note/i }))
    fireEvent.change(screen.getByRole("textbox", { name: /note text/i }), {
      target: { value: EDITED },
    })
    fireEvent.click(screen.getByRole("button", { name: /save the note/i }))

    await screen.findByText(/the change waits for the vault/i)
    expect(
      screen.getByRole("button", { name: /save the note/i })
    ).toBeDisabled()

    status = "succeeded"
    await screen.findByText(/saved\. the vault has the change/i)
    expect(screen.getByRole("button", { name: /save the note/i })).toBeEnabled()
  })
})
