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
 * enters only with its route and the matching fixture or generated contract
 * vocabulary, so a navigation item cannot invent a capability on its own.
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
  {
    id: "github",
    label: "GitHub",
    path: "/github",
    requires: "github.catalog",
  },
  {
    id: "vault",
    label: "Git Vault",
    path: "/vault",
    requires: "vault.git",
  },
]
