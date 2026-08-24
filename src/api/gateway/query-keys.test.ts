import { describe, expect, it } from "vitest"
import { apiKeys, queryKey } from "./query-keys"

describe("contract-shaped query keys", () => {
  it("builds deep-equal keys from identical inputs across repeated calls", () => {
    const first = queryKey("/v1/capabilities")
    const second = queryKey("/v1/capabilities")

    expect(first).toEqual(second)
    expect(Object.isFrozen(first)).toBe(false)
  })

  it("ignores query-parameter insertion order", () => {
    const alphabetical = queryKey("/v1/capabilities", {
      query: { detail: "full", surface: "web" },
    })
    const reordered = queryKey("/v1/capabilities", {
      query: { surface: "web", detail: "full" },
    })

    expect(reordered).toEqual(alphabetical)
  })

  it("produces different keys for different parameters", () => {
    const one = queryKey("/v1/operations/{operation_id}", {
      path: { operation_id: "018f-a" },
    })
    const two = queryKey("/v1/operations/{operation_id}", {
      path: { operation_id: "018f-b" },
    })

    expect(one).not.toEqual(two)
  })

  it("expands a path parameter into its own trailing segment", () => {
    const key = queryKey("/v1/operations/{operation_id}", {
      path: { operation_id: "018f-9" },
    })

    expect(key[0]).toBe("v1")
    expect(key[1]).toBe("operations")
    expect(key[key.length - 1]).toBe("018f-9")
  })

  it("refuses a template whose placeholders the parameters do not fill", () => {
    expect(() =>
      queryKey("/v1/operations/{operation_id}", { path: {} })
    ).toThrow(/operation_id/)
  })

  it("refuses parameters the template never asked for", () => {
    expect(() =>
      queryKey("/v1/capabilities", {
        path: { operation_id: "018f-9" },
      })
    ).toThrow(/operation_id/)
  })

  it("exposes named factories whose keys nest under their invalidation root", () => {
    const operationKey = apiKeys.operation("018f-9")

    expect(apiKeys.capabilities()).toEqual(["v1", "capabilities"])
    expect(operationKey[operationKey.length - 1]).toBe("018f-9")
    const root = apiKeys.operationsRoot()
    expect(operationKey.slice(0, root.length)).toEqual(root)
    expect(apiKeys.operationEvents("018f-9")).toEqual([
      ...operationKey,
      "events",
    ])
  })
})
