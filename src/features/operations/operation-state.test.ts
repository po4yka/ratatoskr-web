import { describe, expect, it } from "vitest"
import {
  applyProgress,
  applySnapshot,
  isTerminal,
  type TrackedOperation,
} from "./operation-state"

const base = {
  accepted_at: "2026-08-27T00:00:00Z",
  correlation_id: "operation:1",
  kind: "content.capture.submit",
  operation_id: "1",
  retryable: false,
  status_changed_at: "2026-08-27T00:00:00Z",
} as const

describe("operation state", () => {
  it("recovers a dropped stream by polling a terminal snapshot once", () => {
    const running = { ...base, status: "running" as const, stage: "Extracting" }
    const done = {
      ...base,
      status: "succeeded" as const,
      terminated_at: "2026-08-27T00:01:00Z",
      status_changed_at: "2026-08-27T00:01:00Z",
    }
    const tracked: TrackedOperation = { snapshot: running, delivery: "stream" }
    const recovered = applySnapshot({ ...tracked, delivery: "polling" }, done)
    expect(recovered.snapshot.status).toBe("succeeded")
    expect(isTerminal(recovered.snapshot.status)).toBe(true)
    expect(applySnapshot(recovered, done)).toEqual(recovered)
  })

  it("renders fixture stages without local phase mapping", () => {
    const snapshot = {
      ...base,
      status: "running" as const,
      stage: "Summarizing",
    }
    expect(applySnapshot(null, snapshot).snapshot.stage).toBe("Summarizing")
  })

  it("keeps terminal progress until the authoritative terminal snapshot arrives", () => {
    const running = applySnapshot(null, {
      ...base,
      status: "running" as const,
      stage: "Persisting",
    })
    const terminalProgress = applyProgress(running, {
      observed_at: "2026-08-27T00:01:00Z",
      progress_percent: 100,
      stage: "Done",
      status: "succeeded",
    })
    const complete = applySnapshot(terminalProgress, {
      ...base,
      results: [
        {
          result_kind: "content.document",
          target: "document:article-1",
        },
      ],
      status: "succeeded" as const,
      status_changed_at: "2026-08-27T00:01:00Z",
      terminated_at: "2026-08-27T00:01:00Z",
    })

    expect(terminalProgress?.snapshot.stage).toBe("Done")
    expect(complete.snapshot.results).toHaveLength(1)
  })
})
