import { useEffect, useRef, useState, type Dispatch } from "react"
import { describeSessionsFailure, type SessionSummary } from "./sessions-source"

/** The session list as the page holds it. */
export type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | {
      readonly kind: "ready"
      readonly sessions: readonly SessionSummary[]
      readonly next: string | null
    }

/** One revocation: the group it belongs to, the call, and what it ends. */
export interface Ending {
  readonly siteId: string
  /** Sends the revocation and answers the sentence of its outcome. */
  readonly run: () => Promise<string>
  readonly ends: (session: SessionSummary) => boolean
}

function isNotFound(failure: unknown): boolean {
  return (failure as { kind?: unknown } | null)?.kind === "not-found"
}

/**
 * The revocations of the session list. Each site has its own pending
 * entry, so two revocations do not clear each other. What a revocation
 * ended leaves the loaded pages, also when the server no longer knows the
 * session. When the last session of a group ends, focus moves to the
 * outcome, because the control that had it is gone.
 */
export function useSessionEnding(
  loaded: Loaded,
  setLoaded: Dispatch<(current: Loaded) => Loaded>
) {
  const [outcome, setOutcome] = useState<string | null>(null)
  const [pendingSites, setPendingSites] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const outcomeRef = useRef<HTMLParagraphElement>(null)
  const endedSite = useRef<string | null>(null)

  useEffect(() => {
    const siteId = endedSite.current
    if (siteId === null || loaded.kind !== "ready") return
    endedSite.current = null
    const left = loaded.sessions.some(
      (session) => session.kind === "site_owner" && session.site_id === siteId
    )
    if (!left) outcomeRef.current?.focus()
  }, [loaded])

  function remove({ siteId, ends }: Ending) {
    endedSite.current = siteId
    setLoaded((current) =>
      current.kind === "ready"
        ? {
            ...current,
            sessions: current.sessions.filter((session) => !ends(session)),
          }
        : current
    )
  }

  async function end(ending: Ending) {
    const { siteId } = ending
    setPendingSites((current) => new Set(current).add(siteId))
    try {
      setOutcome(await ending.run())
      remove(ending)
    } catch (failure) {
      setOutcome(describeSessionsFailure(failure, "The session did not end."))
      if (isNotFound(failure)) remove(ending)
    } finally {
      setPendingSites((current) => {
        const next = new Set(current)
        next.delete(siteId)
        return next
      })
    }
  }

  return { outcome, outcomeRef, pendingSites, end }
}
