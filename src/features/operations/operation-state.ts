import type { components } from "@/api/generated/schema"

export type OperationSnapshot = components["schemas"]["OperationSnapshot"]
export type DeliveryMode = "stream" | "polling"

export interface TrackedOperation {
  readonly snapshot: OperationSnapshot
  readonly delivery: DeliveryMode
}

export interface OperationProgress {
  readonly observed_at: string
  readonly progress_percent: OperationSnapshot["progress_percent"]
  readonly stage: OperationSnapshot["stage"]
  readonly status: OperationSnapshot["status"]
}

export function isTerminal(status: OperationSnapshot["status"]): boolean {
  return (
    status === "succeeded" ||
    status === "partially_succeeded" ||
    status === "failed" ||
    status === "cancelled"
  )
}

/** Applies only a newer server snapshot; terminal truth cannot regress. */
export function applySnapshot(
  current: TrackedOperation | null,
  next: OperationSnapshot
): TrackedOperation {
  if (current === null) return { snapshot: next, delivery: "stream" }
  if (next.status_changed_at < current.snapshot.status_changed_at)
    return current
  if (isTerminal(current.snapshot.status) && !isTerminal(next.status))
    return current
  return { ...current, snapshot: next }
}

/** Merge a recorded progress frame while preserving the snapshot's invariant fields. */
export function applyProgress(
  current: TrackedOperation | null,
  progress: OperationProgress
): TrackedOperation | null {
  if (current === null || isTerminal(current.snapshot.status)) return current
  return applySnapshot(current, {
    ...current.snapshot,
    ...progress,
    status_changed_at: progress.observed_at,
  })
}
