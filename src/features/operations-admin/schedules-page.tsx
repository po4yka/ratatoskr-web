import { useMemo } from "react"
import { useGateway } from "@/api/gateway/context"
import type { components } from "@/api/generated/schema"
import {
  createInspectionSource,
  type ScheduleInspectionPage,
} from "./inspection-source"
import { useInspectionPage } from "./use-inspection-page"
import {
  Fact,
  InspectionFailure,
  InspectionHeader,
  InspectionPending,
  NextPage,
} from "./inspection-layout"

type Row = components["schemas"]["ScheduleInspectionSummary"]

function ScheduleRow({ row }: { row: Row }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Schedule">{row.name}</Fact>
        <Fact label="Service">{row.service_name}</Fact>
        <Fact label="State">{row.enabled ? "Enabled" : "Disabled"}</Fact>
        <Fact label="Last outcome">
          {row.last_outcome
            ? row.last_outcome.replaceAll("_", " ")
            : "Not run yet"}
        </Fact>
        <Fact label="Next due">
          <time dateTime={row.next_due_at}>
            {new Date(row.next_due_at).toLocaleString()}
          </time>
        </Fact>
        <Fact label="Owner">{row.owner_user_id}</Fact>
      </dl>
    </li>
  )
}

export default function SchedulesPage() {
  const gateway = useGateway()
  const source = useMemo(() => createInspectionSource(gateway), [gateway])
  const { state, retry, next } = useInspectionPage<ScheduleInspectionPage>(
    source.schedules
  )
  return (
    <section className="flex flex-col gap-6 py-4">
      <InspectionHeader
        title="Schedule status"
        description="Current Platform-owned schedule projections. This view cannot change a schedule."
      />
      {state.kind === "loading" ? (
        <InspectionPending label="schedules" />
      ) : null}
      {state.kind === "failed" ? (
        <InspectionFailure failure={state.failure} retry={retry} />
      ) : null}
      {state.kind === "ready" && state.page.items.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No schedules were returned.
        </p>
      ) : null}
      {state.kind === "ready" ? (
        <>
          <ul className="grid gap-4">
            {state.page.items.map((row) => (
              <ScheduleRow key={row.schedule_id} row={row} />
            ))}
          </ul>
          <NextPage cursor={state.page.next_cursor} next={next} />
        </>
      ) : null}
    </section>
  )
}
