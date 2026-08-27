/* eslint-disable complexity, max-lines, max-lines-per-function -- one route owns coupled form and list states. */
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { components } from "@/api/generated/schema"
import { useGateway } from "@/api/gateway/context"
import { useCapabilities } from "@/capabilities/capabilities-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CaptureSubmission, validateCaptureUrl } from "./capture-state"
import { rememberCapture } from "./capture-intent"

type CaptureAccepted = components["schemas"]["CaptureAccepted"]
type OperationList = components["schemas"]["OperationList"]

const CAPTURE_KIND = "content.capture.submit"

export default function CapturePage() {
  const gateway = useGateway()
  const navigate = useNavigate()
  const { status, document } = useCapabilities()
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [retryableSubmission, setRetryableSubmission] = useState(false)
  const [recent, setRecent] = useState<OperationList | null>(null)
  const [read, setRead] = useState<Set<string>>(() => new Set())
  const [favorite, setFavorite] = useState<Set<string>>(() => new Set())
  const submission = useMemo(
    () =>
      new CaptureSubmission(async (address, idempotencyKey) => {
        const accepted = await gateway.request<CaptureAccepted>({
          path: "/v1/captures",
          method: "POST",
          body: { url: address },
          headers: { "Idempotency-Key": idempotencyKey },
        })
        if (accepted === undefined)
          throw new Error("Capture acceptance was empty.")
        return accepted.operation_id
      }),
    [gateway]
  )

  useEffect(() => {
    if (
      status !== "ready" ||
      document === null ||
      !document.capabilities.includes("content.submit")
    ) {
      return
    }
    gateway
      .request<OperationList>({
        path: "/v1/operations",
        query: { kind: CAPTURE_KIND, limit: 20 },
      })
      .then((value) =>
        setRecent(value ?? { operations: [], next_cursor: null })
      )
      .catch(() => setRecent(null))
  }, [document, gateway, status])

  async function submit() {
    const problem = validateCaptureUrl(url)
    if (problem) return setError(problem)
    setError(null)
    setRetryableSubmission(false)
    setPending(true)
    try {
      const operationId = await submission.submit(url)
      rememberCapture(operationId, url)
      navigate(`/operations/${operationId}`)
    } catch {
      setError(
        "Capture could not be accepted. Retry sends the same request safely."
      )
      setRetryableSubmission(true)
    } finally {
      setPending(false)
    }
  }

  if (status === "loading")
    return <Status title="Checking capture capability" />
  if (status === "failed" || document === null)
    return <Status title="Capture capability is unavailable" />
  if (!document.capabilities.includes("content.submit")) {
    return <Status title="This deployment cannot capture URLs" />
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="text-heading font-semibold">Capture by URL</h1>
        <p className="mt-2 text-body text-muted-foreground">
          Paste an HTTP(S) address to capture it. Text capture is not available
          in this deployment contract.
        </p>
      </header>
      <form
        className="rounded-xl border border-border bg-card p-5 shadow-subtle"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <label className="text-body font-medium" htmlFor="capture-url">
          URL
        </label>
        <Input
          aria-describedby="capture-help"
          className="mt-2"
          id="capture-url"
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/article"
          type="url"
          value={url}
        />
        <p
          className="mt-2 text-caption text-muted-foreground"
          id="capture-help"
        >
          Only HTTP and HTTPS addresses are accepted.
        </p>
        {error ? (
          <p className="mt-2 text-body text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="mt-4" disabled={pending} type="submit">
          {pending ? "Submitting capture…" : "Capture URL"}
        </Button>
        {retryableSubmission ? (
          <Button
            className="mt-4 ml-2"
            disabled={pending}
            onClick={() => void submit()}
            type="button"
            variant="outline"
          >
            Retry submission
          </Button>
        ) : null}
      </form>
      <section
        aria-live="polite"
        className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      >
        <h2 className="text-heading-sm font-semibold">Recent captures</h2>
        {recent === null ? (
          <p className="mt-2 text-body text-muted-foreground">
            Recent captures could not load.
          </p>
        ) : recent.operations.length === 0 ? (
          <p className="mt-2 text-body text-muted-foreground">
            No capture operations are recorded yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {recent.operations.map((operation) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2"
                key={operation.operation_id}
              >
                <div>
                  <p className="text-body font-medium">
                    {operation.stage ?? operation.kind}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {operation.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    aria-pressed={read.has(operation.operation_id)}
                    onClick={() =>
                      setRead((current) =>
                        toggle(current, operation.operation_id)
                      )
                    }
                    variant="outline"
                  >
                    {read.has(operation.operation_id) ? "Read" : "Mark read"}
                  </Button>
                  <Button
                    aria-pressed={favorite.has(operation.operation_id)}
                    onClick={() =>
                      setFavorite((current) =>
                        toggle(current, operation.operation_id)
                      )
                    }
                    variant="outline"
                  >
                    {favorite.has(operation.operation_id)
                      ? "Favorited"
                      : "Favorite"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-caption text-muted-foreground">
          Read and favorite are local presentation state.
        </p>
      </section>
    </section>
  )
}

function Status({ title }: { title: string }) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      role="status"
    >
      <h1 className="text-heading-sm font-semibold">{title}</h1>
    </section>
  )
}

function toggle(current: Set<string>, value: string): Set<string> {
  const next = new Set(current)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}
