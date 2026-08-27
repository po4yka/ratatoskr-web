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
  readonly group?: "operations"
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
  { id: "social-x", label: "X", path: "/social/x", requires: "social.x" },
  {
    id: "instagram",
    label: "Instagram",
    path: "/social/instagram",
    requires: "social.instagram",
  },
  {
    id: "threads",
    label: "Threads",
    path: "/social/threads",
    requires: "social.threads",
  },
  {
    id: "chatgpt-archive",
    label: "ChatGPT Archive",
    path: "/archives/chatgpt",
    requires: "ai.archive.chatgpt",
  },
  {
    id: "claude-archive",
    label: "Claude Archive",
    path: "/archives/claude",
    requires: "ai.archive.claude",
  },
  {
    id: "connections",
    label: "Connections",
    path: "/connections",
    requires: "connections.providers",
  },
  {
    id: "ops",
    label: "Operations",
    path: "/ops",
    group: "operations",
    requires: "platform.operations.inspect",
  },
  {
    id: "ops-schedules",
    label: "Schedules",
    path: "/ops/schedules",
    group: "operations",
    requires: "platform.schedules.inspect",
  },
  {
    id: "ops-audit",
    label: "Audit",
    path: "/ops/audit",
    group: "operations",
    requires: "platform.audit.inspect",
  },
]
