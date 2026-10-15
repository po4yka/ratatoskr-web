import { useEffect } from "react"
import { Link } from "react-router"
import {
  isTerminal,
  type OperationSnapshot,
} from "@/features/operations/operation-state"
import { describeWriteFailure } from "./notes-write"
import { useOperation } from "./operation-follow"

/** The status line of a write operation, by status, before it ends. */
const WAITING: Readonly<Record<string, string>> = {
  accepted: "The server accepted the change.",
  queued: "The change waits for the vault.",
  running: "The change waits for the vault.",
}

/** The conflict that a failed write raised: the error extension, or the result. */
function conflictOf(snapshot: OperationSnapshot): string | null {
  for (const failure of snapshot.errors ?? [])
    if (typeof failure.conflict_id === "string") return failure.conflict_id
  for (const result of snapshot.results ?? [])
    if (result.target.startsWith("notes_conflict:"))
      return result.target.slice("notes_conflict:".length)
  return null
}

function Failures({ snapshot }: { readonly snapshot: OperationSnapshot }) {
  const conflictId = conflictOf(snapshot)
  return (
    <>
      {snapshot.errors?.map((failure) => (
        <p className="text-body text-destructive" key={failure.code}>
          {describeWriteFailure(failure, failure.message)}
        </p>
      ))}
      {conflictId === null ? null : (
        <Link
          className="text-body font-medium underline"
          to={`/notes/conflicts/${encodeURIComponent(conflictId)}`}
        >
          Resolve the conflict
        </Link>
      )}
    </>
  )
}

function statusLine(
  snapshot: OperationSnapshot | null,
  done: string
): string | null {
  if (snapshot === null) return "Reading the operation of the change."
  if (snapshot.status === "succeeded") return done
  if (snapshot.status === "failed") return "The change failed."
  if (snapshot.status === "cancelled") return "The change was cancelled."
  return WAITING[snapshot.status] ?? snapshot.status
}

/**
 * The progress of one write, resolution or write-mode operation. `done` is
 * the sentence for success. `onSucceeded` runs once when it succeeds.
 */
export function WriteProgress({
  operationId,
  done,
  onSucceeded,
}: {
  readonly operationId: string
  readonly done: string
  readonly onSucceeded?: () => void
}) {
  const { snapshot, polling } = useOperation(operationId)
  const succeeded = snapshot?.status === "succeeded"
  useEffect(() => {
    if (succeeded) onSucceeded?.()
  }, [succeeded, onSucceeded])
  return (
    <div aria-live="polite" className="flex flex-col gap-2" role="status">
      <p className="text-body font-medium">{statusLine(snapshot, done)}</p>
      {snapshot !== null && isTerminal(snapshot.status) ? (
        <Failures snapshot={snapshot} />
      ) : null}
      {polling ? (
        <p className="text-caption text-muted-foreground">
          The live stream is not available. The view reads the operation again
          every few seconds.
        </p>
      ) : null}
    </div>
  )
}
