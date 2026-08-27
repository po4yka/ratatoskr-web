import type { CapabilityName } from "@/capabilities/vocabulary"

/**
 * One primary-navigation destination. A feature that needs something this
 * deployment may not have declares it here, once, beside its label and
 * address — the shell renders entries through the gate, never by hand.
 */
export interface NavEntry {
  /** Stable identity for keys and tests. */
  readonly id: string
  readonly label: string
  readonly path: string
  /**
   * The capability this feature requires. Absent, the entry belongs to every
   * deployment and renders in every discovery state.
   */
  readonly requires?: CapabilityName
}

/**
 * The primary navigation in display order. Every currently shipped surface
 * maps to no capability Platform serves (the closed vocabulary holds
 * `content.submit` and `telegram.mini_app`), so all are ungated by
 * declaration; gated entries join here with their views, not before.
 */
export const NAV_ENTRIES: readonly NavEntry[] = [
  { id: "search", label: "Search", path: "/" },
  {
    id: "capture",
    label: "Capture",
    path: "/capture",
    requires: "content.submit",
  },
  { id: "collections", label: "Collections", path: "/collections" },
  { id: "tags", label: "Tags", path: "/tags" },
]
