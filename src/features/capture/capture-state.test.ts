import { describe, expect, it } from "vitest"
import { CaptureSubmission, validateCaptureUrl } from "./capture-state"

describe("capture submission", () => {
  it("reuses an idempotency key for a transport retry", async () => {
    const keys: string[] = []
    const submit = new CaptureSubmission(async (_url, key) => {
      keys.push(key)
      if (keys.length === 1) throw new Error("offline")
      return "operation-1"
    })
    await expect(submit.submit("https://example.test/article")).rejects.toThrow(
      "offline"
    )
    await expect(submit.submit("https://example.test/article")).resolves.toBe(
      "operation-1"
    )
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])
  })

  it("starts a new key for a terminal retry", async () => {
    const keys: string[] = []
    const submit = new CaptureSubmission(async (_url, key) => {
      keys.push(key)
      return "operation-2"
    })
    await submit.submit("https://example.test/article")
    await submit.retryTerminal("https://example.test/article")
    expect(keys[1]).not.toBe(keys[0])
  })

  it("rejects a non-http URL before a request", () => {
    expect(validateCaptureUrl("file:///private/archive")).toMatch(/http/i)
  })
})
