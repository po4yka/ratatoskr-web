import { describe, expect, it, vi } from "vitest"
import { consumeProgress } from "./operation-stream"

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

describe("consumeProgress", () => {
  it("renders the server's phase fixtures from CRLF-delimited SSE frames", async () => {
    const progress = vi.fn()
    await consumeProgress(
      streamOf(
        'id: 1\r\nevent: progress\r\ndata: {"status":"queued","stage":"Queued","progress_percent":0,"observed_at":"2026-08-27T00:00:00Z"}\r\n\r\n',
        'id: 2\r\nevent: progress\r\ndata: {"status":"running","stage":"Extracting","progress_percent":20,"observed_at":"2026-08-27T00:00:10Z"}\r\n\r\n',
        'id: 3\r\nevent: progress\r\ndata: {"status":"running","stage":"Summarizing","progress_percent":50,"observed_at":"2026-08-27T00:00:20Z"}\r\n\r\n',
        'id: 4\r\nevent: progress\r\ndata: {"status":"running","stage":"Validating","progress_percent":75,"observed_at":"2026-08-27T00:00:30Z"}\r\n\r\n',
        'id: 5\r\nevent: progress\r\ndata: {"status":"running","stage":"Persisting","progress_percent":90,"observed_at":"2026-08-27T00:00:40Z"}\r\n\r\n',
        'id: 6\r\nevent: progress\r\ndata: {"status":"succeeded","stage":"Done","progress_percent":100,"observed_at":"2026-08-27T00:00:50Z"}'
      ),
      progress
    )

    expect(progress.mock.calls.map(([event]) => event.snapshot.stage)).toEqual([
      "Queued",
      "Extracting",
      "Summarizing",
      "Validating",
      "Persisting",
      "Done",
    ])
    expect(progress.mock.calls.at(-1)?.[0].id).toBe("6")
  })

  it("rejects a malformed progress payload so the tracker can recover by polling", async () => {
    await expect(
      consumeProgress(
        streamOf(
          'event: progress\ndata: {"status":"running","stage":"extracting"}\n\n'
        ),
        vi.fn()
      )
    ).rejects.toThrow(/observed_at/i)
  })
})
