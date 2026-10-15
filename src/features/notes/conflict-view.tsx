import { useState } from "react"
import { Link } from "react-router"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import { ConflictSides } from "./conflict-sides"
import { Failure } from "./index-sections"
import { fileLink, useRead } from "./notes-read"
import { notesWrites } from "./notes-write"
import { ResolutionForm } from "./resolution-form"

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
      <p className="text-body text-muted-foreground">
        The vault changed this file after you opened it, so Ratatoskr did not
        write your version.
      </p>
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
