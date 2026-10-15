import { useEffect, useState } from "react"
import { Link } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import type { OperationSnapshot } from "@/features/operations/operation-state"
import { ConflictSides } from "./conflict-sides"
import { Failure } from "./index-sections"
import { fileLink, useRead } from "./notes-read"
import {
  describeWriteFailure,
  notesWrites,
  type NotesConflict,
} from "./notes-write"
import { ResolutionForm } from "./resolution-form"

/** The code of a write group that the vault applied only in part. */
const PARTIALLY_APPLIED = "notes.write.partially_applied"

/** What the operation of a conflict answered, for one operation id. */
interface Reason {
  readonly operationId: string
  readonly partial: boolean
}

/**
 * Why the conflict exists. It reads the operation of the conflict, and
 * shows nothing until that operation answers: a group that the vault
 * applied only in part has its own sentence, and any other answer, a
 * failed read or a conflict without an operation keep the sentence of a
 * stale base. A reason of another operation is not shown.
 */
function ConflictReason({ operationId }: { readonly operationId?: string }) {
  const gateway = useGateway()
  const [reason, setReason] = useState<Reason | null>(null)
  useEffect(() => {
    if (operationId === undefined) return
    let alive = true
    const answer = (partial: boolean) =>
      alive && setReason({ operationId, partial })
    gateway
      .request<OperationSnapshot>({
        path: `/v1/operations/${encodeURIComponent(operationId)}`,
      })
      .then(
        (snapshot) =>
          answer(
            snapshot?.errors?.some(
              (failure) => failure.code === PARTIALLY_APPLIED
            ) ?? false
          ),
        () => answer(false)
      )
    return () => {
      alive = false
    }
  }, [gateway, operationId])
  const known = operationId === undefined || reason?.operationId === operationId
  if (!known) return null
  return (
    <p className="text-body text-muted-foreground">
      {reason?.partial === true && operationId !== undefined
        ? describeWriteFailure({ code: PARTIALLY_APPLIED }, "")
        : "The vault changed this file after you opened it, so Ratatoskr did not write your version."}
    </p>
  )
}

/** The files of a write group that the conflict names, each with a link. */
function StalePaths({ conflict }: { readonly conflict: NotesConflict }) {
  const paths = conflict.stale_paths ?? []
  if (paths.length === 0) return null
  const connection = `/notes/${encodeURIComponent(conflict.connection_id)}`
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-subheading font-semibold" id="notes-conflict-files">
        Files of the change
      </h2>
      <p className="text-body text-muted-foreground">
        These files changed in the vault after you opened them, or the vault did
        not apply the change to them.
      </p>
      <ul
        aria-labelledby="notes-conflict-files"
        className="flex flex-col gap-1"
      >
        {paths.map((path) => (
          <li key={path}>
            <Link
              className="inline-flex min-h-7 items-center text-body break-all hover:underline"
              to={`${connection}${fileLink(path)}`}
            >
              {path}
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
      <StalePaths conflict={conflict} />
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
