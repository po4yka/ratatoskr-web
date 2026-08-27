import { describe, expect, it } from "vitest"
import { createFixtureSocialAiArchiveSource } from "@/features/social-ai-archive/archive-source"

describe("social and AI archive fixture source", () => {
  it("keeps social and AI projections integration-pending", async () => {
    const snapshot = await createFixtureSocialAiArchiveSource().read()

    expect(snapshot.integration).toBe("fixture")
  })

  it("preserves supplied typed, ordered archive records without a gateway request", async () => {
    const snapshot = await createFixtureSocialAiArchiveSource().read()

    expect(snapshot.conversations[0]?.messages[0]?.contentParts).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "text" })])
    )
  })
})
