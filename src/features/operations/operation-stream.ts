/* eslint-disable complexity -- SSE fields and frame boundaries are parsed explicitly. */
import type { OperationProgress } from "./operation-state"

export interface ProgressEvent {
  id: string | null
  snapshot: OperationProgress
}

type SseState = {
  lastEventId: string | null
}

interface FrameContext {
  state: SseState
  onProgress: (event: ProgressEvent) => void
}

const operationStatuses = new Set<OperationProgress["status"]>([
  "accepted",
  "queued",
  "running",
  "succeeded",
  "partially_succeeded",
  "failed",
  "cancelled",
])

/** Parse only persisted `progress` frames; comments and other SSE fields are inert. */
export async function consumeProgress(
  stream: ReadableStream<Uint8Array>,
  onProgress: (event: ProgressEvent) => void
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const context: FrameContext = {
    state: { lastEventId: null },
    onProgress,
  }
  let pending = ""
  try {
    for (;;) {
      const chunk = await reader.read()
      pending += decoder.decode(chunk.value, { stream: !chunk.done })
      const frames = pending.split(/\r?\n\r?\n/)
      pending = frames.pop() ?? ""
      for (const frame of frames) consumeFrame(frame, context)
      if (chunk.done) {
        if (pending.length > 0) consumeFrame(pending, context)
        return
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function consumeFrame(frame: string, context: FrameContext): void {
  let event = "message"
  const data: string[] = []
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith(":")) continue
    const colon = line.indexOf(":")
    const field = colon === -1 ? line : line.slice(0, colon)
    const raw = colon === -1 ? "" : line.slice(colon + 1)
    const value = raw.startsWith(" ") ? raw.slice(1) : raw
    if (field === "event") event = value
    if (field === "id" && !value.includes("\0"))
      context.state.lastEventId = value || null
    if (field === "data") data.push(value)
  }
  if (event !== "progress" || data.length === 0) return
  context.onProgress({
    id: context.state.lastEventId,
    snapshot: parseProgress(data.join("\n")),
  })
}

function parseProgress(data: string): OperationProgress {
  const value: unknown = JSON.parse(data)
  if (
    typeof value !== "object" ||
    value === null ||
    !Object.hasOwn(value, "observed_at") ||
    !Object.hasOwn(value, "status")
  ) {
    throw new Error("Progress payload requires observed_at and status.")
  }
  const record = value as Record<string, unknown>
  if (
    typeof record.observed_at !== "string" ||
    !operationStatuses.has(record.status as OperationProgress["status"])
  ) {
    throw new Error("Progress payload has an invalid observed_at or status.")
  }
  if (
    record.stage !== undefined &&
    record.stage !== null &&
    typeof record.stage !== "string"
  ) {
    throw new Error("Progress payload has an invalid stage.")
  }
  if (
    record.progress_percent !== undefined &&
    record.progress_percent !== null &&
    (typeof record.progress_percent !== "number" ||
      !Number.isFinite(record.progress_percent))
  ) {
    throw new Error("Progress payload has an invalid percentage.")
  }
  return {
    observed_at: record.observed_at,
    progress_percent:
      (record.progress_percent as OperationProgress["progress_percent"]) ??
      null,
    stage: (record.stage as OperationProgress["stage"]) ?? null,
    status: record.status as OperationProgress["status"],
  }
}
