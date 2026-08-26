import { describe, expect, it } from "vitest"
import {
  parseSearchState,
  searchStateHref,
} from "@/features/search/search-state"

describe("search URL state", () => {
  const modes = ["auto", "keyword", "semantic"] as const

  it("restores query, available mode, and page from URL", () => {
    expect(
      parseSearchState("?q=Document+IR&mode=semantic&page=3", modes)
    ).toEqual({ query: "Document IR", mode: "semantic", page: 3 })
  })

  it("resets page when query or mode changes", () => {
    expect(
      searchStateHref(
        { query: "Document IR", mode: "semantic", page: 4 },
        { query: "provenance" }
      )
    ).toBe("/?q=provenance&mode=semantic")

    expect(
      searchStateHref(
        { query: "Document IR", mode: "semantic", page: 4 },
        { mode: "keyword" }
      )
    ).toBe("/?q=Document+IR&mode=keyword")
  })
})
