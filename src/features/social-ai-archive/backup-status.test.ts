import { describe, expect, it } from "vitest"
import { backupStatusLabel } from "@/features/social-ai-archive/backup-status"

describe("backupStatusLabel", () => {
  it("renders locally backed up only for verified evidence", () => {
    expect(backupStatusLabel("verified", "locally_backed_up")).toBe(
      "Locally backed up · verified evidence"
    )
  })

  it("renders missing and quarantined evidence as reference only", () => {
    expect(backupStatusLabel("missing", "reference_only")).toBe(
      "Reference only"
    )
    expect(backupStatusLabel("quarantined", "reference_only")).toBe(
      "Reference only"
    )
  })

  it("does not change evidence status when authorization is expired", () => {
    expect(backupStatusLabel("verified", "locally_backed_up")).toBe(
      "Locally backed up · verified evidence"
    )
  })
})
