import { useMemo } from "react"
import { Link } from "react-router"
import { useGateway } from "@/api/gateway/context"
import type { components } from "@/api/generated/schema"
import {
  createInspectionSource,
  type OperationInspectionPage,
} from "@/features/operations-admin/inspection-source"
import { useInspectionPage } from "@/features/operations-admin/use-inspection-page"
import {
  Fact,
  InspectionFailure,
  InspectionHeader,
  InspectionPending,
  NextPage,
} from "@/features/operations-admin/inspection-layout"

type Row = components["schemas"]["OperationInspectionSummary"]

function label(value: string): string {
  const words = value.replaceAll("_", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function OperationRow({ row }: { row: Row }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Kind">{row.kind}</Fact>
        <Fact label="State">{label(row.status)}</Fact>
        <Fact label="Operation">
          <Link
            className="underline"
            to={`/ops/operations/${row.operation_id}`}
          >
            {row.operation_id}
          </Link>
        </Fact>
        <Fact label="Owner">{row.owner_user_id}</Fact>
        <Fact label="Accepted">
          <time dateTime={row.accepted_at}>
            {new Date(row.accepted_at).toLocaleString()}
          </time>
        </Fact>
        <Fact label="Last change">
          <time dateTime={row.status_changed_at}>
            {new Date(row.status_changed_at).toLocaleString()}
          </time>
        </Fact>
        {row.failure_code ? (
          <Fact label="Failure code">{row.failure_code}</Fact>
        ) : null}
      </dl>
    </li>
  )
}

export default function OperationsPage() {
  const gateway = useGateway()
  const source = useMemo(() => createInspectionSource(gateway), [gateway])
  const { state, retry, next } = useInspectionPage<OperationInspectionPage>(
    source.operations
  )

  return (
    <section className="flex flex-col gap-6 py-4">
      <InspectionHeader
        title="Recent operations"
        description="A bounded, deployment-wide lifecycle view with user-safe failure codes."
      />
      {state.kind === "loading" ? (
        <InspectionPending label="operations" />
      ) : null}
      {state.kind === "failed" ? (
        <InspectionFailure failure={state.failure} retry={retry} />
      ) : null}
      {state.kind === "ready" && state.page.items.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No operations were returned.
        </p>
      ) : null}
      {state.kind === "ready" ? (
        <>
          <ul className="grid gap-4">
            {state.page.items.map((row) => (
              <OperationRow key={row.operation_id} row={row} />
            ))}
          </ul>
          <NextPage cursor={state.page.next_cursor} next={next} />
        </>
      ) : null}
    </section>
  )
}
