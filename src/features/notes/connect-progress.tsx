import { useEffect } from "react"
import {
  isTerminal,
  type OperationSnapshot,
} from "@/features/operations/operation-state"
import { describeNotesFailure } from "./notes-source"
import { useOperation } from "./operation-follow"

const STATUS_TEXT: Readonly<Record<string, string>> = {
  accepted: "Accepted",
  queued: "Waiting to start",
  running: "Connecting",
  succeeded: "Connected",
  partially_succeeded: "Connected with warnings",
  failed: "Failed",
  cancelled: "Cancelled",
}

/** The phases that ratatoskr-notes reports for a connect, as display text. */
const PHASE_TEXT: Readonly<Record<string, string>> = {
  login: "Step 1 of 4: Obsidian login",
  setup: "Step 2 of 4: setup of the sync client",
  first_sync: "Step 3 of 4: first sync of the vault",
  indexing: "Step 4 of 4: indexing of the files",
}

function statusLine(snapshot: OperationSnapshot | null): string {
  if (snapshot === null) return "Reading the connect operation"
  const status = STATUS_TEXT[snapshot.status] ?? snapshot.status
  if (!snapshot.stage) return status
  const phase =
    PHASE_TEXT[snapshot.stage] ?? snapshot.stage.replaceAll("_", " ")
  return `${status} · ${phase}`
}

/** The status and the stage of one connect operation, announced politely. */
export function ConnectProgress({
  operationId,
  onFinished,
}: {
  readonly operationId: string
  readonly onFinished: () => void
}) {
  const { snapshot, polling } = useOperation(operationId)
  const finished = snapshot !== null && isTerminal(snapshot.status)
  useEffect(() => {
    if (finished) onFinished()
  }, [finished, onFinished])

  return (
    <div aria-live="polite" className="mt-4 flex flex-col gap-2" role="status">
      <p className="text-body font-medium">{statusLine(snapshot)}</p>
      {snapshot?.errors?.map((failure) => (
        <p className="text-body text-destructive" key={failure.code}>
          {describeNotesFailure(failure, failure.message)}
        </p>
      ))}
      {snapshot?.warnings?.map((warning) => (
        <p className="text-body" key={warning.code}>
          {describeNotesFailure(warning, warning.message)}
        </p>
      ))}
      {polling ? (
        <p className="text-caption text-muted-foreground">
          The live stream is not available. The view reads the operation again
          every few seconds.
        </p>
      ) : null}
    </div>
  )
}
