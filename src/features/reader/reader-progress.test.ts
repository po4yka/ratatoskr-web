import { beforeEach, describe, expect, it } from "vitest"
import {
  progressForScroll,
  readProgress,
  resumeScrollTop,
  writeProgress,
} from "@/features/reader/reader-progress"

describe("reader progress", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("resumes using current scrollable-distance ratio", () => {
    const geometry = { scrollHeight: 1000, clientHeight: 200 }
    writeProgress("document-ir", progressForScroll(400, geometry))

    expect(readProgress("document-ir")).toBe(0.5)
    expect(resumeScrollTop(0.5, geometry)).toBe(400)
  })

  it("clamps malformed progress to a safe boundary", () => {
    localStorage.setItem("ratatoskr.reader.progress.v1.document-ir", "4")

    expect(readProgress("document-ir")).toBeNull()
    expect(resumeScrollTop(-1, { scrollHeight: 1000, clientHeight: 200 })).toBe(
      0
    )
  })
})
