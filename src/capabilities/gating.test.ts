import { describe, expect, it } from "vitest"
import {
  captureOnlyDeployment,
  emptyDeployment,
  fullDeployment,
  telegramOnlyDeployment,
  unfamiliarExtras,
} from "./capability-fixtures"
import { evaluateGate, type FeatureGate } from "./gating"

describe("evaluateGate", () => {
  describe("a feature without a requirement", () => {
    const ungated: FeatureGate | undefined = undefined

    it("is available while the document is loading", () => {
      expect(
        evaluateGate(ungated, { status: "loading", document: null })
      ).toEqual({
        state: "available",
      })
    })

    it("is available when the read failed and no document is held", () => {
      expect(
        evaluateGate(ungated, { status: "failed", document: null })
      ).toEqual({
        state: "available",
      })
    })

    it("is available against a held document", () => {
      expect(
        evaluateGate(ungated, { status: "ready", document: emptyDeployment })
      ).toEqual({
        state: "available",
      })
    })
  })

  describe("a feature requiring content.submit", () => {
    const gated: FeatureGate = { requires: "content.submit" }

    it("holds a pending verdict while the document loads", () => {
      expect(
        evaluateGate(gated, { status: "loading", document: null })
      ).toEqual({ state: "pending" })
    })

    it("is available when the document lists the capability", () => {
      expect(
        evaluateGate(gated, { status: "ready", document: fullDeployment })
      ).toEqual({
        state: "available",
      })
    })

    it("is unavailable naming the capability when the document omits it", () => {
      expect(
        evaluateGate(gated, {
          status: "ready",
          document: telegramOnlyDeployment,
        })
      ).toEqual({
        state: "unavailable",
        missing: "content.submit",
      })
    })

    it("is unavailable against an empty deployment", () => {
      expect(
        evaluateGate(gated, { status: "ready", document: emptyDeployment })
      ).toEqual({
        state: "unavailable",
        missing: "content.submit",
      })
    })

    it("resolves on the familiar name alone when unfamiliar names ride along", () => {
      expect(
        evaluateGate(gated, { status: "ready", document: unfamiliarExtras })
      ).toEqual({
        state: "available",
      })
    })

    it("is undecidable — never unavailable — when the read failed", () => {
      expect(evaluateGate(gated, { status: "failed", document: null })).toEqual(
        {
          state: "undecidable",
        }
      )
    })

    it("is undecidable when ready is claimed without a document", () => {
      expect(evaluateGate(gated, { status: "ready", document: null })).toEqual({
        state: "undecidable",
      })
    })
  })

  describe("a feature requiring telegram.mini_app", () => {
    const gated: FeatureGate = { requires: "telegram.mini_app" }

    it("is available only when the document lists it", () => {
      expect(
        evaluateGate(gated, { status: "ready", document: fullDeployment })
      ).toEqual({
        state: "available",
      })
      expect(
        evaluateGate(gated, {
          status: "ready",
          document: captureOnlyDeployment,
        })
      ).toEqual({
        state: "unavailable",
        missing: "telegram.mini_app",
      })
    })
  })
})
