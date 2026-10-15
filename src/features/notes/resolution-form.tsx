import { useState, type FormEvent } from "react"
import { useGateway } from "@/api/gateway/context"
import { Button } from "@/components/ui/button"
import {
  TEXT_MEDIA_TYPES,
  describeWriteFailure,
  mediaTypeOf,
  notesWrites,
  type NotesConflict,
  type NotesWrites,
  type ResolutionChoice,
} from "./notes-write"
import { useIdempotencyKey } from "./use-idempotency-key"
import { WriteProgress } from "./write-progress"

/** Each choice, with the consequence that the owner confirms by sending it. */
const CHOICES: readonly {
  readonly choice: ResolutionChoice
  readonly label: string
  readonly consequence: string
}[] = [
  {
    choice: "keep_current",
    label: "Keep the vault version",
    consequence: "Your version is discarded.",
  },
  {
    choice: "keep_writer",
    label: "Keep your version",
    consequence: "Your version replaces the vault version.",
  },
  {
    choice: "accept_merge",
    label: "Accept the merge proposal",
    consequence: "The merged text replaces the vault version.",
  },
  {
    choice: "custom",
    label: "Type the content yourself",
    consequence: "The text that you type replaces the vault version.",
  },
]

/** The choices that notes accepts for this conflict. */
function offered(conflict: NotesConflict) {
  const text = TEXT_MEDIA_TYPES.includes(conflict.media_type)
  return CHOICES.filter(
    ({ choice }) =>
      (choice !== "accept_merge" || conflict.merge_proposal !== undefined) &&
      (choice !== "custom" || text)
  )
}

/** The content that a custom resolution starts from. */
function startText(conflict: NotesConflict): string {
  const texts = conflict.texts ?? {}
  return texts.merged ?? texts.writer ?? texts.current ?? ""
}

interface Resolving {
  readonly writes: NotesWrites
  readonly conflict: NotesConflict
  readonly choice: ResolutionChoice
  readonly custom: string
  /** The held key of this resolution: the same until an answer accepts it. */
  readonly keyFor: (subject: string) => string
}

/** Upload the custom content first, then send the resolution. */
async function resolve(input: Resolving) {
  const { writes, conflict, choice } = input
  const bytes = new TextEncoder().encode(input.custom)
  if (choice === "custom" && bytes.length === 0)
    throw { code: "notes.content.empty" }
  const blob =
    choice === "custom"
      ? await writes.upload({
          connectionId: conflict.connection_id,
          bytes,
          mediaType: mediaTypeOf(conflict.path),
        })
      : undefined
  const subject = `${conflict.conflict_id}\n${choice}\n${blob?.digest.hex ?? ""}`
  return writes.resolve({ conflict, choice, blob, key: input.keyFor(subject) })
}

/** The choices that resolve an open conflict, and the result of the one sent. */
export function ResolutionForm({
  conflict,
}: {
  readonly conflict: NotesConflict
}) {
  const gateway = useGateway()
  const [writes] = useState(() => notesWrites(gateway))
  const [choice, setChoice] = useState<ResolutionChoice | null>(null)
  const [custom, setCustom] = useState(() => startText(conflict))
  const [pending, setPending] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [operationId, setOperationId] = useState<string | null>(null)
  const idempotency = useIdempotencyKey()
  const choices = offered(conflict)
  const chosen = choices.find((entry) => entry.choice === choice)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (choice === null) return setProblem("Select how to resolve it.")
    setPending(true)
    setProblem(null)
    try {
      const answer = await resolve({
        writes,
        conflict,
        choice,
        custom,
        keyFor: idempotency.keyFor,
      })
      idempotency.accepted()
      setOperationId(answer.operation_id)
    } catch (failure) {
      setProblem(
        describeWriteFailure(failure, "The conflict could not be resolved.")
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => void submit(e)}>
      <h2 className="text-subheading font-semibold" id="notes-resolution">
        Resolve the conflict
      </h2>
      <div
        aria-labelledby="notes-resolution"
        className="flex flex-col gap-2"
        role="radiogroup"
      >
        {choices.map((entry) => (
          <label
            className="flex items-center gap-2 text-body"
            key={entry.choice}
          >
            <input
              checked={choice === entry.choice}
              className="size-4"
              name="notes-resolution"
              onChange={() => setChoice(entry.choice)}
              type="radio"
            />
            {entry.label}
          </label>
        ))}
      </div>
      {chosen ? <p className="text-body">{chosen.consequence}</p> : null}
      {choice === "custom" ? (
        <>
          <label className="text-body font-medium" htmlFor="notes-custom">
            Content to keep
          </label>
          <textarea
            className="min-h-48 max-w-[70ch] rounded-lg border border-border bg-background p-3 font-sans text-body"
            id="notes-custom"
            onChange={(event) => setCustom(event.target.value)}
            minLength={1}
            required
            value={custom}
          />
        </>
      ) : null}
      {problem ? (
        <p className="text-body text-destructive" role="alert">
          {problem}
        </p>
      ) : null}
      <Button className="self-start" disabled={pending} type="submit">
        {pending ? "Sending the resolution…" : "Send the resolution"}
      </Button>
      {operationId ? (
        <WriteProgress
          done="The conflict is resolved. The vault has the version that you selected."
          key={operationId}
          operationId={operationId}
        />
      ) : null}
    </form>
  )
}
