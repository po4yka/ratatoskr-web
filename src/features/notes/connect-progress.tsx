import { useEffect, useState } from "react"
import { useGateway } from "@/api/gateway/context"
import {
  applyProgress,
  applySnapshot,
  isTerminal,
  type OperationSnapshot,
  type TrackedOperation,
} from "@/features/operations/operation-state"
import { consumeProgress } from "@/features/operations/operation-stream"
import { describeNotesFailure } from "./notes-source"

const POLL_INTERVAL_MS = 3000

/**
 * Follow one operation through the public operation API: the stream first,
 * and polling when the gateway cannot stream or the stream drops.
 */
function useOperation(operationId: string) {
  const gateway = useGateway()
  const [tracked, setTracked] = useState<TrackedOperation | null>(null)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    let alive = true
    let timer: number | undefined
    const later = () => {
      timer = window.setTimeout(() => void read(true), POLL_INTERVAL_MS)
    }
    async function read(repeat: boolean): Promise<OperationSnapshot | null> {
      try {
        const value = await gateway.request<OperationSnapshot>({
          path: `/v1/operations/${encodeURIComponent(operationId)}`,
        })
        if (!alive || value === undefined) return null
        setTracked((current) => applySnapshot(current, value))
        if (repeat && !isTerminal(value.status)) later()
        return value
      } catch {
        if (alive) later()
        return null
      }
    }
    async function follow() {
      const initial = await read(false)
      if (!alive || initial === null || isTerminal(initial.status)) return
      if (gateway.stream === undefined) throw new Error("No stream.")
      const body = await gateway.stream({
        path: `/v1/operations/${encodeURIComponent(operationId)}/events`,
      })
      await consumeProgress(body, (event) => {
        if (alive)
          setTracked((current) => applyProgress(current, event.snapshot))
      })
      if (alive) void read(true)
    }
    follow().catch(() => {
      if (!alive) return
      setPolling(true)
      later()
    })
    return () => {
      alive = false
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [gateway, operationId])

  return { snapshot: tracked?.snapshot ?? null, polling }
}

const STATUS_TEXT: Readonly<Record<string, string>> = {
  accepted: "Accepted",
  queued: "Waiting to start",
  running: "Connecting",
  succeeded: "Connected",
  partially_succeeded: "Connected with warnings",
  failed: "Failed",
  cancelled: "Cancelled",
}

function statusLine(snapshot: OperationSnapshot | null): string {
  if (snapshot === null) return "Reading the connect operation"
  const status = STATUS_TEXT[snapshot.status] ?? snapshot.status
  return snapshot.stage
    ? `${status} · ${snapshot.stage.replaceAll("_", " ")}`
    : status
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
      {polling ? (
        <p className="text-caption text-muted-foreground">
          The live stream is not available. The view reads the operation again
          every few seconds.
        </p>
      ) : null}
    </div>
  )
}
