import { useEffect, useRef } from "react"
import { isTerminal } from "@/features/operations/operation-state"
import { useOperation } from "@/features/notes/operation-follow"
import { describeBuildFailure } from "./releases-source"

const STATUS_TEXT: Readonly<Record<string, string>> = {
  accepted: "The server accepted the build request.",
  queued: "The build waits to start.",
  running: "The release is being built.",
  succeeded: "The build ended. The release history shows the result.",
  failed: "The build failed.",
  cancelled: "The build was cancelled.",
}

/** The progress of one build operation. `onEnded` runs once when it ends. */
export function BuildProgress({
  operationId,
  onEnded,
}: {
  readonly operationId: string
  readonly onEnded: () => void
}) {
  const { snapshot, polling } = useOperation(operationId)
  const status = snapshot?.status
  const reported = useRef(false)
  useEffect(() => {
    if (status === undefined || !isTerminal(status) || reported.current) return
    reported.current = true
    onEnded()
  }, [status, onEnded])
  return (
    <div aria-live="polite" className="flex flex-col gap-2" role="status">
      <p className="text-body font-medium">
        {snapshot === null
          ? "Reading the build operation."
          : (STATUS_TEXT[snapshot.status] ?? snapshot.status)}
      </p>
      {snapshot?.errors?.map((failure) => (
        <p className="text-body text-destructive" key={failure.code}>
          {describeBuildFailure(failure.code) ?? failure.message}
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
