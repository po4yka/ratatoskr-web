import { describe, expect, it } from "vitest"
import {
  applyOptimistic,
  CurationController,
  fixtureCurationSnapshot,
  tagMergePreview,
  type CurationSource,
} from "@/features/collections/curation-source"

function deferred<T>() {
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((_resolve, rejectPromise) => {
    reject = rejectPromise
  })

  return { promise, reject }
}

describe("fixture curation source", () => {
  it("preserves ordered items across add and remove", () => {
    const withItem = applyOptimistic(fixtureCurationSnapshot, {
      kind: "add-item",
      collectionId: "reading",
      documentId: "search-evidence",
    })
    const withoutItem = applyOptimistic(withItem, {
      kind: "remove-item",
      collectionId: "reading",
      documentId: "document-ir",
    })

    expect(withItem.collections[0]?.itemIds).toEqual([
      "document-ir",
      "search-evidence",
    ])
    expect(withoutItem.collections[0]?.itemIds).toEqual(["search-evidence"])
  })

  it("previews a tag merge without double-counting", () => {
    expect(
      tagMergePreview(fixtureCurationSnapshot, "provenance", "contracts")
    ).toMatchObject({
      sourceName: "provenance",
      targetName: "contracts",
      affectedDocumentIds: ["document-ir"],
      resultingCount: 1,
    })
  })

  it("restores the prior snapshot after a rejected mutation", async () => {
    const request = deferred<typeof fixtureCurationSnapshot>()
    const source: CurationSource = {
      read: async () => fixtureCurationSnapshot,
      mutate: async () => request.promise,
    }
    const controller = new CurationController(source, fixtureCurationSnapshot)
    const mutation = controller.run({
      kind: "delete-collection",
      collectionId: "reading",
    })

    expect(controller.snapshot().collections).toHaveLength(0)
    request.reject(new Error("fixture rejected deletion"))
    await expect(mutation).rejects.toThrow("fixture rejected deletion")
    expect(controller.snapshot()).toEqual(fixtureCurationSnapshot)
  })
})
