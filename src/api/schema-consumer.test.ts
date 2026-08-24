import { describe, expect, it } from "vitest"

describe("schema-consumer", () => {
  // Type-only imports are invisible to vitest, so this case only proves the
  // consumer module loads at runtime; `npm run typecheck` is the honest
  // verifier that the generated-module imports resolve.
  it("imports from the generated module resolve", async () => {
    const consumer = await import("./schema-consumer")
    expect(consumer).toBeTypeOf("object")
  })
})
