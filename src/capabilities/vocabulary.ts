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
 * Source of truth today: Platform's closed enum serves `content.submit`
 * (capture at `POST /v1/captures`) and `telegram.mini_app` (assertion exchange
 * at `POST /v1/sessions/telegram`). No route family this client ships yet maps
 * to either, which is why every current surface is ungated by declaration.
 */
export const KNOWN_CAPABILITIES = [
  "content.submit",
  "telegram.mini_app",
] as const

export type CapabilityName = (typeof KNOWN_CAPABILITIES)[number]
