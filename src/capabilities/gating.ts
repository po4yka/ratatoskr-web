import type { components } from "@/api/generated/schema"
import type { CapabilityName } from "./vocabulary"

/** The capability document exactly as the pinned contract shapes it. */
export type CapabilityDocument = components["schemas"]["CapabilityDocument"]

/**
 * How far discovery has got. `ready` always accompanies a held document;
 * `failed` means the client is holding nothing and knows it cannot decide.
 */
export type CapabilitiesStatus = "loading" | "ready" | "failed"

/**
 * What a feature declares about the deployment it needs. Absent, the feature
 * belongs to every deployment and never waits on discovery.
 */
export interface FeatureGate {
  readonly requires?: CapabilityName
}

/**
 * What discovery currently holds: the load state and, when an answer
 * stands, the document it came from. The capability context exposes exactly
 * this shape, so callers hand their context value straight over.
 */
export interface DiscoveryState {
  readonly status: CapabilitiesStatus
  readonly document: CapabilityDocument | null
}

/**
 * One verdict per feature. The four states render differently downstream:
 * pending holds a loading region, undecidable offers retry with truthful
 * copy, unavailable explains what this deployment lacks — and available
 * renders the feature.
 */
export type GateVerdict =
  | { state: "available" }
  | { state: "pending" }
  | { state: "undecidable" }
  | { state: "unavailable"; missing: CapabilityName }

/**
 * The one gating rule every navigation entry and route goes through. Total
 * over its inputs: whatever discovery is doing, a feature gets exactly one
 * verdict, and a failed read never masquerades as knowledge about what the
 * deployment lacks.
 */
export function evaluateGate(
  gate: FeatureGate | undefined,
  discovery: DiscoveryState
): GateVerdict {
  const requires = gate?.requires
  if (requires === undefined) return { state: "available" }

  const { status, document } = discovery
  if (status === "loading") return { state: "pending" }
  if (status === "failed" || document === null) return { state: "undecidable" }

  return document.capabilities.includes(requires)
    ? { state: "available" }
    : { state: "unavailable", missing: requires }
}
