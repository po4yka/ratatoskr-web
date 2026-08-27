import { afterEach, describe, expect, it, vi } from "vitest"
import { captureUrlFor, rememberCapture } from "./capture-intent"

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
})

describe("capture intent memory", () => {
  it("does not turn an accepted capture into a client failure when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError")
    })

    expect(() =>
      rememberCapture("operation-1", "https://example.test/article")
    ).not.toThrow()
  })

  it("returns no retry URL when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError")
    })

    expect(captureUrlFor("operation-1")).toBeNull()
  })
})
