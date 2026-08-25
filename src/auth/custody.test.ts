import { beforeEach, describe, expect, it } from "vitest"
import { discardCustody, readCustody, storeCustody } from "./custody"

describe("credential custody", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("stores, reads, and completely discards one credential", () => {
    expect(readCustody()).toBeNull()

    storeCustody("credential-1")
    expect(readCustody()).toBe("credential-1")

    discardCustody()
    expect(readCustody()).toBeNull()
  })
})
