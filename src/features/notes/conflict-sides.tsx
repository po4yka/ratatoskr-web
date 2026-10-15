import {
  TEXT_MEDIA_TYPES,
  type ConflictSide,
  type NotesConflict,
} from "./notes-write"

const SIDE_TITLES: Readonly<Record<ConflictSide, string>> = {
  current: "Vault version",
  writer: "Your version",
  base: "Common base",
  merged: "Merge proposal",
}

/** Why a side has no text to show. */
function absence(conflict: NotesConflict, side: ConflictSide): string {
  if (conflict.texts_over_limit?.includes(side))
    return "This text is too large to show."
  if (!TEXT_MEDIA_TYPES.includes(conflict.media_type))
    return "This file is not text, so this view cannot show it."
  return "The server does not have this text."
}

function Side({
  conflict,
  side,
}: {
  readonly conflict: NotesConflict
  readonly side: ConflictSide
}) {
  const text = conflict.texts?.[side]
  const id = `notes-conflict-${side}`
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h2 className="text-subheading font-semibold" id={id}>
        {SIDE_TITLES[side]}
      </h2>
      {text === undefined ? (
        <p className="text-body text-muted-foreground">
          {absence(conflict, side)}
        </p>
      ) : (
        <pre className="max-w-[70ch] rounded-lg border border-border p-3 font-sans text-body whitespace-pre-wrap">
          {text}
        </pre>
      )}
    </section>
  )
}

/** Why a conflict has no merge proposal, or `null` when nothing is missing. */
function missingProposal(conflict: NotesConflict): string | null {
  if (conflict.merge_proposal !== undefined || conflict.state !== "open")
    return null
  if (!TEXT_MEDIA_TYPES.includes(conflict.media_type))
    return "Ratatoskr does not merge a file that is not text."
  if ((conflict.texts_over_limit?.length ?? 0) > 0)
    return "Ratatoskr does not merge a text that is this large."
  return "There is no merge proposal now. The server can still be making it. Load the conflict again in a moment."
}

/** A note on the merge proposal: absent, or with overlapping changes. */
function ProposalNote({ conflict }: { readonly conflict: NotesConflict }) {
  const missing = missingProposal(conflict)
  if (conflict.merge_proposal?.has_overlapping_hunks)
    return (
      <p className="text-body font-medium" role="note">
        The two versions changed the same lines. Examine the merge proposal
        before you accept it.
      </p>
    )
  if (missing === null) return null
  return (
    <p className="text-body text-muted-foreground" role="note">
      {missing}
    </p>
  )
}

/** The sides of a conflict, as text, and why a side is missing. */
export function ConflictSides({
  conflict,
}: {
  readonly conflict: NotesConflict
}) {
  const sides: readonly ConflictSide[] =
    conflict.merge_proposal === undefined
      ? ["current", "writer", "base"]
      : ["current", "writer", "merged", "base"]
  return (
    <div className="flex flex-col gap-4">
      <ProposalNote conflict={conflict} />
      <div className="grid gap-4 md:grid-cols-2">
        {sides.map((side) => (
          <Side conflict={conflict} key={side} side={side} />
        ))}
      </div>
    </div>
  )
}
