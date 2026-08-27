import { useCallback, useMemo } from "react"
import { Link, useParams } from "react-router"
import { useGateway } from "@/api/gateway/context"
import {
  createInspectionSource,
  type OperationDetail,
} from "@/features/operations-admin/inspection-source"
import { useInspectionPage } from "@/features/operations-admin/use-inspection-page"
import {
  Fact,
  InspectionFailure,
  InspectionPending,
} from "@/features/operations-admin/inspection-layout"

function Detail({ operation }: { operation: OperationDetail }) {
  return (
    <>
      <dl className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-subtle sm:grid-cols-2">
        <Fact label="Operation">{operation.operation_id}</Fact>
        <Fact label="Kind">{operation.kind}</Fact>
        <Fact label="State">{operation.status.replaceAll("_", " ")}</Fact>
        <Fact label="Stage">{operation.stage ?? "No stage reported"}</Fact>
        <Fact label="Progress">
          {operation.progress_percent == null
            ? "Unknown"
            : `${operation.progress_percent}%`}
        </Fact>
        <Fact label="Retryable">{operation.retryable ? "Yes" : "No"}</Fact>
      </dl>
      {operation.errors?.map((failure) => (
        <article
          key={failure.code}
          className="rounded-xl border border-destructive p-5"
        >
          <h2 className="text-subheading font-semibold">{failure.code}</h2>
          <p className="mt-2 text-body text-muted-foreground">
            {failure.message}
          </p>
        </article>
      ))}
    </>
  )
}

export default function OperationDetailPage() {
  const { operationId } = useParams()
  const gateway = useGateway()
  const source = useMemo(() => createInspectionSource(gateway), [gateway])
  const read = useCallback(
    (_cursor: string | null, signal: AbortSignal) => {
      if (!operationId)
        return Promise.reject({ kind: "not-found", status: 404 })
      return source.operation(operationId, signal)
    },
    [operationId, source]
  )
  const { state, retry } = useInspectionPage<OperationDetail>(read)

  return (
    <section className="flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <Link
          className="inline-flex min-h-7 items-center text-body underline"
          to="/ops"
        >
          Back to operations
        </Link>
        <h1 className="text-heading font-semibold">Operation detail</h1>
        <p className="text-body text-muted-foreground">
          The current generated snapshot and its user-safe failures.
        </p>
      </header>
      {state.kind === "loading" ? (
        <InspectionPending label="operation detail" />
      ) : null}
      {state.kind === "failed" ? (
        <InspectionFailure failure={state.failure} retry={retry} />
      ) : null}
      {state.kind === "ready" ? <Detail operation={state.page} /> : null}
    </section>
  )
}
