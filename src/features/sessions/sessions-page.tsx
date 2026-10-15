import { useCallback, useEffect, useMemo, useState } from "react"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import {
  describeSessionsFailure,
  groupBySite,
  sessionsSource,
  type SessionSummary,
} from "./sessions-source"
import { SiteSessionGroup, When } from "./site-session-group"

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "failed"; readonly message: string }
  | {
      readonly kind: "ready"
      readonly sessions: readonly SessionSummary[]
      readonly next: string | null
    }

function OtherSessions({
  sessions,
}: {
  readonly sessions: readonly SessionSummary[]
}) {
  if (sessions.length === 0) return null
  return (
    <section aria-labelledby="other-sessions" className="flex flex-col gap-3">
      <h2 className="text-heading-sm font-semibold" id="other-sessions">
        Other sessions
      </h2>
      <ul className="flex flex-col gap-2">
        {sessions.map((session) => (
          <li
            className="rounded-lg border border-border p-3 text-body"
            key={session.session_id}
          >
            <span className="font-medium">{session.kind}</span>
            {session.device
              ? ` on ${session.device.display_name ?? session.device.kind}`
              : null}
            . Signed in{" "}
            <When none="at an unknown time" value={session.issued_at} />. Last
            use: <When none="not yet" value={session.last_seen_at} />.
          </li>
        ))}
      </ul>
    </section>
  )
}

/** `/sessions`: where the user is signed in, and the site sessions to end. */
export default function SessionsPage() {
  const gateway = useGateway()
  const source = useMemo(() => sessionsSource(gateway), [gateway])
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" })
  const [outcome, setOutcome] = useState<string | null>(null)
  const load = useCallback(
    (cursor: string | null, before: readonly SessionSummary[]) =>
      source.page(cursor).then(
        (page) =>
          setLoaded({
            kind: "ready",
            sessions: [...before, ...page.sessions],
            next: page.next_cursor ?? null,
          }),
        (failure: unknown) =>
          setLoaded({
            kind: "failed",
            message: describeSessionsFailure(
              failure,
              "The sessions could not load."
            ),
          })
      ),
    [source]
  )
  useEffect(() => {
    void load(null, [])
  }, [load])

  async function end(action: () => Promise<unknown>, done: string) {
    try {
      await action()
      setOutcome(done)
    } catch (failure) {
      setOutcome(describeSessionsFailure(failure, "The session did not end."))
    }
    await load(null, [])
  }

  const groups = loaded.kind === "ready" ? groupBySite(loaded.sessions) : null
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <h1 className="text-heading font-semibold">Sessions</h1>
      {loaded.kind === "loading" ? (
        <p role="status">Loading the sessions</p>
      ) : null}
      {loaded.kind === "failed" ? (
        <p className="text-body text-destructive" role="alert">
          {loaded.message}
        </p>
      ) : null}
      {groups !== null ? (
        <>
          <section
            aria-labelledby="site-sessions"
            className="flex flex-col gap-3"
          >
            <h2 className="text-heading-sm font-semibold" id="site-sessions">
              Site sessions
            </h2>
            {groups.sites.length === 0 ? (
              <p className="text-body">No site has an owner session.</p>
            ) : (
              groups.sites.map((group) => (
                <SiteSessionGroup
                  group={group}
                  key={group.siteId}
                  onEndOne={(sessionId) =>
                    void end(
                      () => source.revoke(sessionId),
                      "The session ended."
                    )
                  }
                  onEndSite={(siteId) =>
                    void end(
                      () => source.revokeSite(siteId),
                      `The sessions of ${siteId} ended.`
                    )
                  }
                />
              ))
            )}
          </section>
          <OtherSessions sessions={groups.others} />
        </>
      ) : null}
      {loaded.kind === "ready" && loaded.next !== null ? (
        <Button
          className="self-start"
          onClick={() => void load(loaded.next, loaded.sessions)}
          variant="outline"
        >
          Load more sessions
        </Button>
      ) : null}
      <p aria-live="polite" className="text-body" role="status">
        {outcome}
      </p>
    </section>
  )
}
