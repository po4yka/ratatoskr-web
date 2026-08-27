import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter, Route, Routes } from "react-router"
import { describe, expect, it } from "vitest"
import { GatewayProvider } from "@/api/gateway/context"
import type { Gateway } from "@/api/gateway/client"
import type { components } from "@/api/generated/schema"
import { rememberCapture } from "@/features/capture/capture-intent"
import OperationPage from "./operation-page"

type Snapshot = components["schemas"]["OperationSnapshot"]

function snapshot(over: Partial<Snapshot>): Snapshot {
  return {
    accepted_at: "2026-08-27T00:00:00Z",
    correlation_id: "operation:1",
    kind: "content.capture.submit",
    operation_id: "operation-1",
    retryable: false,
    status: "running",
    status_changed_at: "2026-08-27T00:00:00Z",
    ...over,
  }
}

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

function renderOperation(gateway: Gateway, additionalRoute?: ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/operations/operation-1"]}>
      <GatewayProvider gateway={gateway}>
        <Routes>
          <Route path="/operations/:operationId" element={<OperationPage />} />
          {additionalRoute}
        </Routes>
      </GatewayProvider>
    </MemoryRouter>
  )
}

describe("operation recovery", () => {
  it("recovers a dropped stream through visible polling without duplicate terminal handling", async () => {
    let reads = 0
    let resolveTerminal: (value: Snapshot) => void = () => undefined
    const terminal = new Promise<Snapshot>((resolve) => {
      resolveTerminal = resolve
    })
    const gateway: Gateway = {
      request: (async () => {
        reads += 1
        return reads === 1 ? snapshot({ stage: "Extracting" }) : terminal
      }) as Gateway["request"],
      stream: async () => Promise.reject(new Error("stream dropped")),
    }
    renderOperation(
      gateway,
      <Route
        path="/documents/:documentId"
        element={<h1>Recovered analysis</h1>}
      />
    )
    expect(
      await screen.findByText(
        /live stream disconnected; recovering through polling/i
      )
    ).toBeInTheDocument()
    resolveTerminal(
      snapshot({
        results: [
          { result_kind: "content.document", target: "document:article-1" },
        ],
        status: "succeeded",
        status_changed_at: "2026-08-27T00:01:00Z",
        terminated_at: "2026-08-27T00:01:00Z",
      })
    )
    expect(
      await screen.findByRole("heading", { name: /recovered analysis/i })
    ).toBeInTheDocument()
    expect(reads).toBe(2)
  })

  it("retries a terminal failure as a new capture operation", async () => {
    rememberCapture("operation-1", "https://example.test/article")
    const keys: string[] = []
    const gateway: Gateway = {
      request: (async (request) => {
        if (request.path === "/v1/captures") {
          keys.push(request.headers?.["Idempotency-Key"] ?? "")
          return { operation_id: "operation-2", status: "accepted" }
        }
        return snapshot({
          status: "failed",
          retryable: true,
          errors: [
            {
              code: "platform.capture.failed",
              message: "Capture failed.",
              retryable: true,
            },
          ],
          terminated_at: "2026-08-27T00:01:00Z",
          status_changed_at: "2026-08-27T00:01:00Z",
        })
      }) as Gateway["request"],
      stream: async () => new ReadableStream(),
    }
    render(
      <MemoryRouter initialEntries={["/operations/operation-1"]}>
        <GatewayProvider gateway={gateway}>
          <Routes>
            <Route
              path="/operations/:operationId"
              element={<OperationPage />}
            />
            <Route
              path="/operations/operation-2"
              element={<h1>New operation</h1>}
            />
          </Routes>
        </GatewayProvider>
      </MemoryRouter>
    )
    fireEvent.click(
      await screen.findByRole("button", { name: /retry capture/i })
    )
    expect(keys[0]).not.toHaveLength(0)
    expect(
      await screen.findByRole("heading", { name: /new operation/i })
    ).toBeInTheDocument()
  })
})

describe("operation presentation", () => {
  it("renders a phase received from the persisted event stream", async () => {
    let reads = 0
    const gateway: Gateway = {
      request: (async () => {
        reads += 1
        if (reads === 1) return snapshot({ stage: "queued" })
        return new Promise<Snapshot>(() => {})
      }) as Gateway["request"],
      stream: async () =>
        streamOf(
          'id: event-1\nevent: progress\ndata: {"status":"running","stage":"extracting","progress_percent":20,"observed_at":"2026-08-27T00:00:10Z"}\n\n',
          'id: event-2\nevent: progress\ndata: {"status":"running","stage":"persisting","progress_percent":90,"observed_at":"2026-08-27T00:00:20Z"}\n\n'
        ),
    }
    renderOperation(gateway)

    expect(
      await screen.findByText(/running · persisting · 90%/i)
    ).toBeInTheDocument()
  })

  it("keeps a degraded terminal warning visible before opening the resulting analysis", async () => {
    const gateway: Gateway = {
      request: (async () =>
        snapshot({
          results: [
            { result_kind: "content.document", target: "document:article-1" },
          ],
          status: "partially_succeeded",
          status_changed_at: "2026-08-27T00:01:00Z",
          terminated_at: "2026-08-27T00:01:00Z",
          warnings: [
            {
              code: "platform.capture.degraded",
              message:
                "Extraction was degraded; the saved link remains available.",
            },
          ],
        })) as Gateway["request"],
    }
    renderOperation(
      gateway,
      <Route
        path="/documents/:documentId"
        element={<h1>Resulting analysis</h1>}
      />
    )

    expect(
      await screen.findByText(/extraction was degraded/i)
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: /open resulting analysis/i })
    )
    expect(
      await screen.findByRole("heading", { name: /resulting analysis/i })
    ).toBeInTheDocument()
  })
})
