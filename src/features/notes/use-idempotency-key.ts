import { useRef } from "react"
import { newIdempotencyKey } from "./notes-write"

/**
 * One Idempotency-Key per logical request. `keyFor(subject)` gives the same
 * key while the subject (the content, the choice or the mode) stays the same
 * and no answer accepted it, so a request sent again after a lost answer is
 * a replay at Edge and not a second operation. `accepted()` ends the request:
 * the next one gets a new key.
 */
export function useIdempotencyKey() {
  const held = useRef<{ subject: string; key: string } | null>(null)
  return {
    keyFor(subject: string): string {
      if (held.current?.subject !== subject)
        held.current = { subject, key: newIdempotencyKey() }
      return held.current.key
    },
    accepted() {
      held.current = null
    },
  }
}
