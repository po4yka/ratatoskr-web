import { useEffect, useState } from "react"
import { Link } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import type { OperationSnapshot } from "@/features/operations/operation-state"
import { ConflictSides } from "./conflict-sides"
import { Failure } from "./index-sections"
import { fileLink, useRead } from "./notes-read"
import { describeWriteFailure, notesWrites } from "./notes-write"
import { ResolutionForm } from "./resolution-form"

/** The code of a write group that the vault applied only in part. */
const PARTIALLY_APPLIED = "notes.write.partially_applied"

/**
 * Why the conflict exists. It reads the operation of the conflict once; a
 * group that the vault applied only in part has its own sentence, and any
 * other answer, or none, keeps the sentence of a stale base.
 */
function ConflictReason({ operationId }: { readonly operationId?: string }) {
  const gateway = useGateway()
  const [partial, setPartial] = useState(false)
  useEffect(() => {
    if (operationId === undefined) return
    let alive = true
    gateway
      .request<OperationSnapshot>({
        path: `/v1/operations/${encodeURIComponent(operationId)}`,
      })
      .then(
        (snapshot) =>
          alive &&
          setPartial(
            snapshot?.errors?.some(
              (failure) => failure.code === PARTIALLY_APPLIED
            ) ?? false
          ),
        () => undefined
      )
    return () => {
      alive = false
    }
  }, [gateway, operationId])
  return (
    <p className="text-body text-muted-foreground">
      {partial
        ? describeWriteFailure({ code: PARTIALLY_APPLIED }, "")
        : "The vault changed this file after you opened it, so Ratatoskr did not write your version."}
    </p>
  )
}

function ConflictBody({
  conflictId,
  onReload,
}: {
  readonly conflictId: string
  readonly onReload: () => void
}) {
  const gateway = useGateway()
  const [load] = useState(() => () => notesWrites(gateway).conflict(conflictId))
  const read = useRead(load, "This conflict could not load.")
  if (read.kind === "loading") return <p role="status">Loading the conflict</p>
  if (read.kind === "failed") return <Failure message={read.message} />
  const conflict = read.value
  return (
    <>
      <h1 className="text-heading font-semibold break-all">
        Conflict in {conflict.path}
      </h1>
      <ConflictReason operationId={conflict.operation_id} />
      <div className="flex flex-wrap gap-4">
        <Link
          className="text-body hover:underline"
          to={`/notes/${encodeURIComponent(conflict.connection_id)}${fileLink(conflict.path)}`}
        >
          Open the file
        </Link>
        <Button onClick={onReload} type="button" variant="outline">
          Load the conflict again
        </Button>
      </div>
      <ConflictSides conflict={conflict} />
      {conflict.state === "open" ? (
        <ResolutionForm conflict={conflict} />
      ) : (
        <p className="text-body">This conflict is resolved.</p>
      )}
    </>
  )
}

/** One conflict of a write: its sides and the choices that resolve it. */
export function ConflictView({ conflictId }: { readonly conflictId: string }) {
  const [round, setRound] = useState(0)
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <Link
        className="text-body text-muted-foreground hover:underline"
        to="/notes"
      >
        All vaults
      </Link>
      <ConflictBody
        conflictId={conflictId}
        key={round}
        onReload={() => setRound((current) => current + 1)}
      />
    </section>
  )
}
