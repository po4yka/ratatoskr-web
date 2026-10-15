import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { FilePanel } from "./file-panel"
import { Failure } from "./index-sections"
import { fileLink, useRead } from "./notes-read"
import type { NotesSource } from "./notes-source"

function FileListPanel({
  source,
  connectionId,
}: {
  readonly source: NotesSource
  readonly connectionId: string
}) {
  const [load] = useState(() => () => source.files(connectionId))
  const files = useRead(load, "The files of this vault could not load.")
  if (files.kind === "loading") return <p role="status">Loading the files</p>
  if (files.kind === "failed") return <Failure message={files.message} />
  if (files.value.length === 0)
    return (
      <p className="text-body text-muted-foreground">
        This vault has no files yet.
      </p>
    )
  return (
    <nav aria-label="Vault files">
      <ul className="flex flex-col gap-1">
        {files.value.map((file) => (
          <li key={file.path}>
            <Link
              className="text-body hover:underline"
              to={fileLink(file.path)}
            >
              {file.path}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** The read-only browse of one connection: its files, one file, its backlinks. */
export function BrowseView({
  source,
  connectionId,
}: {
  readonly source: NotesSource
  readonly connectionId: string
}) {
  const [params] = useSearchParams()
  const path = params.get("file")
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <Link
          className="text-body text-muted-foreground hover:underline"
          to="/notes"
        >
          All vaults
        </Link>
        <h1 className="mt-2 text-heading font-semibold">Vault files</h1>
        <p className="mt-2 text-body text-muted-foreground">
          This view is read-only. Change the files in Obsidian.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <FileListPanel
          connectionId={connectionId}
          key={connectionId}
          source={source}
        />
        {path === null ? (
          <p className="text-body text-muted-foreground">
            Select a file to read it.
          </p>
        ) : (
          <FilePanel
            connectionId={connectionId}
            key={path}
            path={path}
            source={source}
          />
        )}
      </div>
    </section>
  )
}
