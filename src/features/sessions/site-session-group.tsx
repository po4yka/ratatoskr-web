import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { SessionSummary, SiteSessions } from "./sessions-source"

/** What the owner is about to end: every session of the site, or one. */
type Ending =
  | { readonly kind: "site" }
  | { readonly kind: "one"; readonly sessionId: string }

/** A time of the session list, or the text for a time it does not have. */
export function When({
  value,
  none,
}: {
  readonly value: string | null | undefined
  readonly none: string
}) {
  if (value === null || value === undefined) return <>{none}</>
  return <time dateTime={value}>{new Date(value).toLocaleString()}</time>
}

function SessionItem({
  session,
  onEnd,
}: {
  readonly session: SessionSummary
  readonly onEnd: () => void
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
      <p className="text-body">
        Signed in <When none="at an unknown time" value={session.issued_at} />.
        Last use: <When none="not yet" value={session.last_seen_at} />.
      </p>
      <Button onClick={onEnd} variant="outline">
        End this session
      </Button>
    </li>
  )
}

function EndDialog({
  group,
  ending,
  onCancel,
  onConfirm,
}: {
  readonly group: SiteSessions
  readonly ending: Ending | null
  readonly onCancel: () => void
  readonly onConfirm: (ending: Ending) => void
}) {
  const site = group.hostname ?? group.siteId
  const all = ending?.kind === "site"
  return (
    <AlertDialog onOpenChange={(next) => !next && onCancel()} open={!!ending}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {all
              ? `End all sessions of ${group.siteId}?`
              : `End this session of ${group.siteId}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {all
              ? `The site ${site} signs you out at once. You can sign in again from the site.`
              : `The site ${site} signs out this session at once. Other sessions stay.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {all ? "Keep the sessions" : "Keep the session"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => ending && onConfirm(ending)}
            variant="destructive"
          >
            {all ? "End the sessions" : "End the session"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** The `site_owner` sessions of one site, and the actions that end them. */
export function SiteSessionGroup({
  group,
  onEndSite,
  onEndOne,
}: {
  readonly group: SiteSessions
  readonly onEndSite: (siteId: string) => void
  readonly onEndOne: (sessionId: string) => void
}) {
  const [ending, setEnding] = useState<Ending | null>(null)
  const id = `site-sessions-${group.siteId}`
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <h3 className="text-subheading font-semibold" id={id}>
        Sessions of {group.siteId}
      </h3>
      {group.hostname === null ? null : (
        <p className="text-body break-all text-muted-foreground">
          {group.hostname}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {group.sessions.map((session) => (
          <SessionItem
            key={session.session_id}
            onEnd={() =>
              setEnding({ kind: "one", sessionId: session.session_id })
            }
            session={session}
          />
        ))}
      </ul>
      <Button
        className="self-start"
        onClick={() => setEnding({ kind: "site" })}
        variant="outline"
      >
        {`End all sessions of ${group.siteId}`}
      </Button>
      <EndDialog
        ending={ending}
        group={group}
        onCancel={() => setEnding(null)}
        onConfirm={(confirmed) => {
          setEnding(null)
          if (confirmed.kind === "site") onEndSite(group.siteId)
          else onEndOne(confirmed.sessionId)
        }}
      />
    </section>
  )
}
