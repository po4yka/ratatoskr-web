import { useState } from "react"
import { Link } from "react-router"
import { fileLink, useRead, type Read } from "./notes-read"
import type { FileIndex, FileText, NotesSource } from "./notes-source"

export function Failure({ message }: { readonly message: string }) {
  return (
    <p className="text-body text-destructive" role="alert">
      {message}
    </p>
  )
}

function Backlinks({ index }: { readonly index: Read<FileIndex> }) {
  return (
    <section aria-labelledby="notes-backlinks" className="flex flex-col gap-2">
      <h3 className="text-subheading font-semibold" id="notes-backlinks">
        Backlinks
      </h3>
      {index.kind === "loading" ? (
        <p role="status">Loading the backlinks</p>
      ) : null}
      {index.kind === "failed" ? <Failure message={index.message} /> : null}
      {index.kind === "ready" && index.value.backlinks.length === 0 ? (
        <p className="text-body text-muted-foreground">
          No file links to this file.
        </p>
      ) : null}
      {index.kind === "ready" ? (
        <ul className="flex flex-col gap-1">
          {index.value.backlinks.map((link) => (
            <li key={link.path}>
              <Link
                className="text-body hover:underline"
                to={fileLink(link.path)}
              >
                {link.path}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

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
  const text: Read<FileText> = useRead(loads.text, "This file could not load.")
  const index = useRead(loads.index, "The backlinks could not load.")
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
      {text.kind === "ready" ? (
        <pre className="max-w-[70ch] font-sans text-body-lg whitespace-pre-wrap">
          {text.value.content}
        </pre>
      ) : null}
      <Backlinks index={index} />
    </article>
  )
}
