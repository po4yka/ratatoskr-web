import { beforeEach, describe, expect, it } from "vitest"
import {
  readerPreferencesKey,
  readReaderPreferences,
  writeReaderPreferences,
} from "@/features/reader/reader-preferences"

describe("reader preferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("restores valid persisted reading settings", () => {
    writeReaderPreferences({
      fontScale: "large",
      lineHeight: "relaxed",
      measure: "narrow",
      theme: "sepia",
      fontFamily: "serif",
    })

    expect(readReaderPreferences()).toEqual({
      fontScale: "large",
      lineHeight: "relaxed",
      measure: "narrow",
      theme: "sepia",
      fontFamily: "serif",
    })
  })

  it("rejects invalid local values", () => {
    localStorage.setItem(
      readerPreferencesKey,
      JSON.stringify({ fontScale: 99 })
    )

    expect(readReaderPreferences()).toEqual({
      fontScale: "default",
      lineHeight: "comfortable",
      measure: "comfortable",
      theme: "system",
      fontFamily: "geist",
    })
  })
})
