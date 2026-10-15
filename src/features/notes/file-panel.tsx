import { useState } from "react"
import { Failure, IndexSections } from "./index-sections"
import { NoteText } from "./note-editor"
import { useRead } from "./notes-read"
import type { NotesSource } from "./notes-source"

/** One file of a vault: its text, then its links, tags, properties, backlinks. */
export function FilePanel({
  source,
  connectionId,
  path,
}: {
  readonly source: NotesSource
  readonly connectionId: string
  readonly path: string
}) {
  const [loads] = useState(() => ({
    text: () => source.file(connectionId, path),
    index: () => source.index(connectionId, path),
  }))
  const text = useRead(loads.text, "This file could not load.")
  const index = useRead(loads.index, "The index of this file could not load.")
  return (
    <article
      aria-labelledby="notes-file-heading"
      className="flex flex-col gap-4"
    >
      <h2
        className="text-heading-sm font-semibold break-all"
        id="notes-file-heading"
      >
        {path}
      </h2>
      {text.kind === "loading" ? <p role="status">Loading the file</p> : null}
      {text.kind === "failed" ? <Failure message={text.message} /> : null}
      {text.kind === "ready" && text.value.text === null ? (
        <p className="text-body text-muted-foreground">
          This file is not text, so this view cannot show it.
        </p>
      ) : null}
      {text.kind === "ready" && text.value.text !== null ? (
        <NoteText
          connectionId={connectionId}
          loaded={{ text: text.value.text, revision: text.value.revision }}
          path={path}
        />
      ) : null}
      <IndexSections index={index} />
    </article>
  )
}
