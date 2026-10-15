import { useState } from "react"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import { describeWriteFailure, notesWrites } from "./notes-write"
import { useIdempotencyKey } from "./use-idempotency-key"
import { WriteProgress } from "./write-progress"

type Mode = "on" | "off"

/**
 * The write-back switch of one connection. Notes does not report the mode of
 * a connection yet, so the switch offers both changes and shows the result of
 * the last one. Every connection starts with write-back off. A change sent
 * again after a lost answer keeps its Idempotency-Key.
 */
export function WriteModeSwitch({
  connectionId,
}: {
  readonly connectionId: string
}) {
  const gateway = useGateway()
  const [writes] = useState(() => notesWrites(gateway))
  const [pending, setPending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [sent, setSent] = useState<{ mode: Mode; operationId: string } | null>(
    null
  )
  const idempotency = useIdempotencyKey()

  async function change(mode: Mode) {
    setPending(true)
    setProblem(null)
    try {
      const answer = await writes.setWriteMode({
        connectionId,
        mode,
        key: idempotency.keyFor(`${connectionId}\n${mode}`),
      })
      idempotency.accepted()
      setSent({ mode, operationId: answer.operation_id })
    } catch (failure) {
      setProblem(
        describeWriteFailure(failure, "The write mode could not be changed.")
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      aria-labelledby="notes-write-mode-heading"
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <h2
        className="text-subheading font-semibold"
        id="notes-write-mode-heading"
      >
        Write-back
      </h2>
      <p className="text-body text-muted-foreground">
        Ratatoskr changes this vault only while write-back is on. Every vault
        starts with write-back off. When you turn it off, the changes that did
        not reach the vault yet fail.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => void change("on")}>
          Turn write-back on
        </Button>
        <Button
          disabled={pending}
          onClick={() => void change("off")}
          variant="outline"
        >
          Turn write-back off
        </Button>
      </div>
      {problem ? (
        <p className="text-body text-destructive" role="alert">
          {problem}
        </p>
      ) : null}
      {sent ? (
        <WriteProgress
          done={`Write-back is ${sent.mode}.`}
          key={sent.operationId}
          operationId={sent.operationId}
        />
      ) : null}
    </section>
  )
}
