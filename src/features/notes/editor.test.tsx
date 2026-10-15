import { createHash } from "node:crypto"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { GatewayRequest } from "@/api/gateway/client"
import { fileBytes } from "./browse-fixtures"
import { renderNotes } from "./notes-fixtures"
import { storedBlob, writes } from "./write-fixtures"

const PLAN = "/notes/connection-1?file=Projects%2FPlan.md"
const CONNECTION = "/v1/notes/connections/connection-1"
const LOADED = "# Plan\nShip the reader first."
const EDITED = "# Plan\nShip the editor first."

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

function indexOf(
  calls: readonly GatewayRequest[],
  method: string,
  path: string
): number {
  return calls.findIndex((call) => call.method === method && call.path === path)
}

function headerOf(call: GatewayRequest | undefined, name: string) {
  const headers = new Headers(call?.headers ?? {})
  return headers.get(name)
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

    await waitFor(() =>
      expect(indexOf(recorded, "POST", `${CONNECTION}/writes`)).not.toBe(-1)
    )
    const open = indexOf(recorded, "POST", `${CONNECTION}/blobs`)
    const chunk = indexOf(
      recorded,
      "PUT",
      `${CONNECTION}/blobs/upload-1/chunks/0`
    )
    const finalize = indexOf(
      recorded,
      "POST",
      `${CONNECTION}/blobs/upload-1/finalize`
    )
    const write = indexOf(recorded, "POST", `${CONNECTION}/writes`)
    expect(open).toBeGreaterThanOrEqual(0)
    expect(chunk).toBeGreaterThan(open)
    expect(finalize).toBeGreaterThan(chunk)
    expect(write).toBeGreaterThan(finalize)

    const length = new TextEncoder().encode(EDITED).length
    expect(recorded[open]?.body).toMatchObject({
      declared_size_bytes: length,
      digest: { algorithm: "sha256", hex: sha256(EDITED) },
    })
    expect(new TextDecoder().decode(recorded[chunk]?.bytes)).toBe(EDITED)
    expect(recorded[finalize]?.body).toEqual({ resumption_token: "upload-1" })
    expect(recorded[write]?.body).toEqual({
      operation: {
        update: {
          path: "Projects/Plan.md",
          base_hash: sha256(LOADED),
          blob: storedBlob(sha256(EDITED), length),
        },
      },
    })
    const key = headerOf(recorded[write], "idempotency-key")
    expect(key?.length ?? 0).toBeGreaterThan(0)
    expect(key?.length ?? 0).toBeLessThanOrEqual(255)
  })

  it("write-mode switch sends PUT write-mode", async () => {
    const recorded: GatewayRequest[] = renderNotes({
      path: "/notes/connection-1",
      respond: (request) => writes(recorded)(request),
    })

    fireEvent.click(
      await screen.findByRole("button", { name: /turn write-back on/i })
    )

    await waitFor(() =>
      expect(indexOf(recorded, "PUT", `${CONNECTION}/write-mode`)).not.toBe(-1)
    )
    const put = recorded[indexOf(recorded, "PUT", `${CONNECTION}/write-mode`)]
    expect(put?.body).toEqual({ write_mode: "on" })
    const key = headerOf(put, "idempotency-key")
    expect(key?.length ?? 0).toBeGreaterThan(0)
    expect(key?.length ?? 0).toBeLessThanOrEqual(255)
  })
})
