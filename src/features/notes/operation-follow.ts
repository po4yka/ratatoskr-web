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

const POLL_INTERVAL_MS = 3000

/**
 * Follow one operation through the public operation API: the stream first,
 * and polling when the gateway cannot stream or the stream drops.
 */
export function useOperation(operationId: string) {
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
