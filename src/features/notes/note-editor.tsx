import { useState, type FormEvent } from "react"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import type { LoadedFile } from "./notes-source"
import {
  describeWriteFailure,
  mediaTypeOf,
  newIdempotencyKey,
  notesWrites,
} from "./notes-write"
import { WriteProgress } from "./write-progress"

interface Target {
  readonly connectionId: string
  readonly path: string
  readonly loaded: LoadedFile & { readonly text: string }
}

/** Why the content cannot be saved, or `null`: an upload needs one byte at least. */
function validateNote(bytes: Uint8Array): string | null {
  if (bytes.length === 0)
    return "The note is empty. Type some text before you save it."
  return null
}

/**
 * The editor of one text note. A save uploads the new content first, and then
 * sends one `update` whose base is the revision that the editor loaded. A
 * second save names the hash of the first, because notes checks each base when
 * the write before it is acknowledged.
 */
function NoteEditor({
  target,
  onClose,
}: {
  readonly target: Target
  readonly onClose: () => void
}) {
  const { connectionId, path, loaded } = target
  const gateway = useGateway()
  const [writes] = useState(() => notesWrites(gateway))
  const [draft, setDraft] = useState(loaded.text)
  const [base, setBase] = useState(loaded.revision)
  const [pending, setPending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [operationId, setOperationId] = useState<string | null>(null)

  async function save(event: FormEvent) {
    event.preventDefault()
    const bytes = new TextEncoder().encode(draft)
    const invalid = validateNote(bytes)
    if (invalid) return setProblem(invalid)
    setPending(true)
    setProblem(null)
    setOperationId(null)
    try {
      const blob = await writes.upload({
        connectionId,
        bytes,
        mediaType: mediaTypeOf(path),
      })
      const answer = await writes.update({
        connectionId,
        key: newIdempotencyKey(),
        operation: { update: { path, base_hash: base, blob } },
      })
      setBase(blob.digest.hex)
      setOperationId(answer.operation_id)
    } catch (failure) {
      setProblem(describeWriteFailure(failure, "The note could not be saved."))
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => void save(e)}>
      <label className="text-body font-medium" htmlFor="notes-editor-text">
        Note text
      </label>
      <textarea
        className="min-h-64 max-w-[70ch] rounded-lg border border-border bg-background p-3 font-sans text-body-lg"
        id="notes-editor-text"
        onChange={(event) => setDraft(event.target.value)}
        minLength={1}
        required
        value={draft}
      />
      <p className="text-caption text-muted-foreground">
        The vault gets the change only while write-back is on for this vault.
      </p>
      {problem ? (
        <p className="text-body text-destructive" role="alert">
          {problem}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving the note…" : "Save the note"}
        </Button>
        <Button onClick={onClose} type="button" variant="outline">
          Close the editor
        </Button>
      </div>
      {operationId ? (
        <WriteProgress
          done="Saved. The vault has the change."
          key={operationId}
          operationId={operationId}
        />
      ) : null}
    </form>
  )
}

/** The text of one note, and the editor when the owner asks for it. */
export function NoteText(target: Target) {
  const [editing, setEditing] = useState(false)
  if (editing)
    return <NoteEditor onClose={() => setEditing(false)} target={target} />
  return (
    <>
      <pre className="max-w-[70ch] font-sans text-body-lg whitespace-pre-wrap">
        {target.loaded.text}
      </pre>
      <Button
        className="self-start"
        onClick={() => setEditing(true)}
        type="button"
        variant="outline"
      >
        Edit this note
      </Button>
    </>
  )
}
