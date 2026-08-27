/* eslint-disable complexity, max-lines-per-function -- operation transport lifecycle stays one cancellable effect. */
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import {
  captureUrlFor,
  rememberCapture,
} from "@/features/capture/capture-intent"
import {
  applyProgress,
  applySnapshot,
  isTerminal,
  type OperationSnapshot,
  type TrackedOperation,
} from "./operation-state"
import { consumeProgress } from "./operation-stream"

const pollIntervalMs = 3000

export default function OperationPage() {
  const gateway = useGateway()
  const navigate = useNavigate()
  const { operationId } = useParams()
  const [tracked, setTracked] = useState<TrackedOperation | null>(null)
  const [mode, setMode] = useState<"stream" | "polling">("stream")
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!operationId) return undefined
    let alive = true
    let timer: number | undefined
    const read = async (repeat: boolean): Promise<OperationSnapshot | null> => {
      try {
        const value = await gateway.request<OperationSnapshot>({
          path: `/v1/operations/${operationId}`,
        })
        if (!alive || value === undefined) return null
        setTracked((current) => applySnapshot(current, value))
        if (repeat && !isTerminal(value.status))
          timer = window.setTimeout(() => void read(true), pollIntervalMs)
        return value
      } catch {
        if (alive) {
          setError(true)
          setMode("polling")
          timer = window.setTimeout(() => void read(true), pollIntervalMs)
        }
        return null
      }
    }
    const stream = gateway.stream
    void (async () => {
      const initial = await read(false)
      if (!alive || initial === null || isTerminal(initial.status)) return
      if (stream === undefined) {
        setMode("polling")
        timer = window.setTimeout(() => void read(true), pollIntervalMs)
        return
      }
      try {
        const body = await stream({
          path: `/v1/operations/${operationId}/events`,
        })
        await consumeProgress(body, (event) => {
          if (alive)
            setTracked((current) => applyProgress(current, event.snapshot))
        })
        if (alive) void read(true)
      } catch {
        if (alive) {
          setMode("polling")
          void read(true)
        }
      }
    })()
    return () => {
      alive = false
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [gateway, operationId])

  const snapshot = tracked?.snapshot ?? null
  const document = snapshot?.results?.find(
    (result) => result.result_kind === "content.document"
  )
  const readerPath =
    snapshot !== null && isTerminal(snapshot.status) && document !== undefined
      ? `/documents/${document.target.replace(/^document:/, "")}`
      : null
  const autoReaderPath = snapshot?.status === "succeeded" ? readerPath : null
  const retryUrl = operationId ? captureUrlFor(operationId) : null

  useEffect(() => {
    if (autoReaderPath !== null) navigate(autoReaderPath)
  }, [autoReaderPath, navigate])

  if (!operationId) return <Outcome title="Operation is unavailable" />
  if (snapshot === null) return <Outcome title="Loading operation" />

  async function retryCapture() {
    if (retryUrl === null) return
    const accepted = await gateway.request<{ operation_id: string }>({
      path: "/v1/captures",
      method: "POST",
      body: { url: retryUrl },
      headers: { "Idempotency-Key": crypto.randomUUID() },
    })
    if (accepted !== undefined) {
      rememberCapture(accepted.operation_id, retryUrl)
      navigate(`/operations/${accepted.operation_id}`)
    }
  }
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <header>
        <h1 className="text-heading font-semibold">Capture operation</h1>
        <p className="mt-2 text-body text-muted-foreground">
          {snapshot.status}
          {snapshot.stage ? ` · ${snapshot.stage}` : ""}
          {snapshot.progress_percent == null
            ? ""
            : ` · ${snapshot.progress_percent}%`}
        </p>
        {mode === "polling" ? (
          <p className="mt-2 text-caption text-muted-foreground" role="status">
            Live stream disconnected; recovering through polling.
          </p>
        ) : null}
      </header>
      {snapshot.warnings?.map((warning) => (
        <p
          className="rounded-lg border border-border p-3 text-body"
          key={warning.code}
        >
          {warning.message}
        </p>
      ))}
      {snapshot.errors?.map((failure) => (
        <p
          className="rounded-lg border border-destructive p-3 text-body"
          key={failure.code}
          role="alert"
        >
          {failure.message}
        </p>
      ))}
      {snapshot.retryable &&
      isTerminal(snapshot.status) &&
      retryUrl !== null ? (
        <Button onClick={() => void retryCapture()} variant="outline">
          Retry capture
        </Button>
      ) : null}
      {snapshot.status === "partially_succeeded" && readerPath !== null ? (
        <Button onClick={() => navigate(readerPath)} variant="outline">
          Open resulting analysis
        </Button>
      ) : null}
      {error ? (
        <p className="text-caption text-muted-foreground">
          The latest answer will remain visible while recovery continues.
        </p>
      ) : null}
    </section>
  )
}

function Outcome({ title }: { title: string }) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      role="status"
    >
      <h1 className="text-heading-sm font-semibold">{title}</h1>
    </section>
  )
}
