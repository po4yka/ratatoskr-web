/**
 * The capability names this client knows, and the whole set of them.
 *
 * Platform's vocabulary is closed on the server; this union closes it on the
 * client too. A registry entry may only require a name drawn from here, so a
 * misspelled or not-yet-existing requirement is a compile error rather than a
 * feature that silently disappears.
 *
 * Per the pinned contract, a name in the document that this client has never
 * heard of names a feature this client does not implement: it gates nothing
 * and nothing here needs to change when Platform grows the set. When this
 * client gains a gated feature, its capability joins this one union.
 *
 * `github.catalog` and `vault.git` are contract-fixed fixture names for the
 * integration-pending catalog slice. They are deliberately not generated Edge
 * vocabulary; a workspace contract change must replace them before live calls
 * are introduced.
 */
export const KNOWN_CAPABILITIES = [
  "content.submit",
  "platform.operations.inspect",
  "platform.schedules.inspect",
  "platform.audit.inspect",
  "github.catalog",
  "ai.archive.chatgpt",
  "ai.archive.claude",
  "connections.providers",
  "social.instagram",
  "social.threads",
  "social.x",
  "telegram.mini_app",
  "vault.git",
] as const

export type CapabilityName = (typeof KNOWN_CAPABILITIES)[number]
