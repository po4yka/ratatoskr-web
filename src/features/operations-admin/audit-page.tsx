import { useMemo } from "react"
import { useGateway } from "@/api/gateway/context"
import type { components } from "@/api/generated/schema"
import {
  createInspectionSource,
  type AuditEventPage,
} from "./inspection-source"
import { useInspectionPage } from "./use-inspection-page"
import {
  Fact,
  InspectionFailure,
  InspectionHeader,
  InspectionPending,
  NextPage,
} from "./inspection-layout"

type Row = components["schemas"]["AuditEventSummary"]

function actorOf(row: Row): string {
  if (row.actor_user_id) return `User ${row.actor_user_id}`
  if (row.actor_session_id) return `Session ${row.actor_session_id}`
  return "Unknown actor"
}

function AuditRow({ row }: { row: Row }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Action">{row.action}</Fact>
        <Fact label="Outcome">{row.outcome}</Fact>
        <Fact label="Actor">{actorOf(row)}</Fact>
        <Fact label="Target">
          {row.target_kind}
          {row.target_id ? ` · ${row.target_id}` : ""}
        </Fact>
        <Fact label="Correlation">{row.correlation_id}</Fact>
        <Fact label="Occurred">
          <time dateTime={row.occurred_at}>
            {new Date(row.occurred_at).toLocaleString()}
          </time>
        </Fact>
      </dl>
    </li>
  )
}

export default function AuditPage() {
  const gateway = useGateway()
  const source = useMemo(() => createInspectionSource(gateway), [gateway])
  const { state, retry, next } = useInspectionPage<AuditEventPage>(source.audit)
  return (
    <section className="flex flex-col gap-6 py-4">
      <InspectionHeader
        title="Audit trail"
        description="A bounded, newest-first record of redacted actions and outcomes."
      />
      {state.kind === "loading" ? (
        <InspectionPending label="audit events" />
      ) : null}
      {state.kind === "failed" ? (
        <InspectionFailure failure={state.failure} retry={retry} />
      ) : null}
      {state.kind === "ready" && state.page.items.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No audit events were returned.
        </p>
      ) : null}
      {state.kind === "ready" ? (
        <>
          <ul className="grid gap-4">
            {state.page.items.map((row) => (
              <AuditRow key={row.audit_event_id} row={row} />
            ))}
          </ul>
          <NextPage cursor={state.page.next_cursor} next={next} />
        </>
      ) : null}
    </section>
  )
}
