import { createHash } from "node:crypto"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { GatewayRequest } from "@/api/gateway/client"
import { fileBytes } from "./browse-fixtures"
import { renderNotes } from "./notes-fixtures"
import {
  conflicts,
  withoutAnswer,
  writeOperation,
  writes,
} from "./write-fixtures"

const PLAN = "/notes/connection-1?file=Projects%2FPlan.md"
const CONNECTION = "/v1/notes/connections/connection-1"
const WRITE = `POST ${CONNECTION}/writes`

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

/** The calls to `"<METHOD> <path>"`, in the order they were sent. */
function callsTo(calls: readonly GatewayRequest[], route: string) {
  return calls.filter((call) => `${call.method} ${call.path}` === route)
}

/** The Idempotency-Key of each call to `route`. */
function keysOf(calls: readonly GatewayRequest[], route: string) {
  return callsTo(calls, route).map((call) =>
    new Headers(call.headers).get("idempotency-key")
  )
}

/** Type `text` into the open editor and save it once the editor is idle. */
async function save(text: string) {
  const button = await screen.findByRole("button", { name: /^save the note$/i })
  fireEvent.change(screen.getByRole("textbox", { name: /note text/i }), {
    target: { value: text },
  })
  fireEvent.click(button)
}

/** Open the editor of `Projects/Plan.md` behind `respond`. */
async function openEditor(
  respond: (calls: GatewayRequest[]) => (request: GatewayRequest) => unknown
) {
  const recorded: GatewayRequest[] = renderNotes({
    path: PLAN,
    respond: (request) => respond(recorded)(request),
    stream: fileBytes,
  })
  await screen.findByText(/ship the reader first/i)
  fireEvent.click(screen.getByRole("button", { name: /edit this note/i }))
  return recorded
}

/** Each write mints the next operation: the first fails, the second succeeds. */
function failThenSucceed(recorded: readonly GatewayRequest[]) {
  return (request: GatewayRequest): unknown => {
    const count = callsTo(recorded, WRITE).length
    if (`${request.method} ${request.path}` === WRITE)
      return { operation_id: `operation-${count}`, status: "accepted" }
    if (request.path === "/v1/operations/operation-1")
      return {
        ...writeOperation("notes.file.write", "failed"),
        errors: [
          {
            code: "notes.write.disabled",
            message: "Write mode is off.",
            retryable: false,
          },
        ],
      }
    if (request.path === "/v1/operations/operation-2")
      return writeOperation("notes.file.write", "succeeded")
    return writes(recorded)(request)
  }
}

describe("a write that is sent again", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("a save without an answer is sent again with the same key, and new content with a new key", async () => {
    const recorded = await openEditor((calls) =>
      withoutAnswer({ route: WRITE, times: 2, respond: writes(calls) })
    )

    await save("# Plan\nShip the editor first.")
    await waitFor(() => expect(keysOf(recorded, WRITE)).toHaveLength(1))
    await save("# Plan\nShip the editor first.")
    await waitFor(() => expect(keysOf(recorded, WRITE)).toHaveLength(2))
    await save("# Plan\nShip the search first.")
    await waitFor(() => expect(keysOf(recorded, WRITE)).toHaveLength(3))

    const [first, retry, changed] = keysOf(recorded, WRITE)
    expect(first).toBeTruthy()
    expect(retry).toBe(first)
    expect(changed).not.toBe(first)
  })

  it("the base becomes the written content only when the write succeeds", async () => {
    const recorded = await openEditor(failThenSucceed)
    const bases = () =>
      callsTo(recorded, WRITE).map(
        (call) =>
          (call.body as { operation: { update: { base_hash: string } } })
            .operation.update.base_hash
      )

    await save("# Plan\nFirst try.")
    await screen.findByText(/write-back is off for this vault/i)
    await save("# Plan\nSecond try.")
    await screen.findByText(/saved\. the vault has the change/i)
    await save("# Plan\nThird try.")
    await waitFor(() => expect(bases()).toHaveLength(3))

    expect(bases()).toEqual([
      sha256("# Plan\nShip the reader first."),
      sha256("# Plan\nShip the reader first."),
      sha256("# Plan\nSecond try."),
    ])
  })

  it("a write-mode change without an answer is sent again with the same key", async () => {
    const route = `PUT ${CONNECTION}/write-mode`
    const recorded: GatewayRequest[] = renderNotes({
      path: "/notes/connection-1",
      respond: (request) =>
        withoutAnswer({ route, times: 2, respond: writes(recorded) })(request),
    })
    const turn = async (name: RegExp, count: number) => {
      const button = await screen.findByRole("button", { name })
      await waitFor(() => expect(button).toBeEnabled())
      fireEvent.click(button)
      await waitFor(() => expect(keysOf(recorded, route)).toHaveLength(count))
    }

    await turn(/turn write-back on/i, 1)
    await turn(/turn write-back on/i, 2)
    await turn(/turn write-back off/i, 3)

    const [first, retry, changed] = keysOf(recorded, route)
    expect(first).toBeTruthy()
    expect(retry).toBe(first)
    expect(changed).not.toBe(first)
  })

  it("a resolution without an answer is sent again with the same key", async () => {
    const route = "POST /v1/notes/conflicts/conflict-1/resolution"
    const recorded: GatewayRequest[] = renderNotes({
      path: "/notes/conflicts/conflict-1",
      respond: withoutAnswer({ route, times: 2, respond: conflicts }),
    })
    const send = async (choice: RegExp, count: number) => {
      fireEvent.click(await screen.findByRole("radio", { name: choice }))
      fireEvent.click(
        await screen.findByRole("button", { name: /^send the resolution$/i })
      )
      await waitFor(() => expect(keysOf(recorded, route)).toHaveLength(count))
    }

    await send(/keep your version/i, 1)
    await send(/keep your version/i, 2)
    await send(/keep the vault version/i, 3)

    const [first, retry, changed] = keysOf(recorded, route)
    expect(first).toBeTruthy()
    expect(retry).toBe(first)
    expect(changed).not.toBe(first)
  })
})
