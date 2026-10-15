import { useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router"
import { FilePanel } from "./file-panel"
import { Failure } from "./index-sections"
import { fileLink, useRead, type Read } from "./notes-read"
import {
  describeNotesFailure,
  type NotesFile,
  type NotesSource,
} from "./notes-source"

function FileListPanel({
  files,
}: {
  readonly files: Read<readonly NotesFile[]>
}) {
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

/**
 * Show `children` only for a path that the loaded file list holds. A path
 * from the address that the vault does not list is never requested.
 */
function ListedFile({
  files,
  path,
  children,
}: {
  readonly files: Read<readonly NotesFile[]>
  readonly path: string
  readonly children: ReactNode
}) {
  if (files.kind !== "ready") return null
  if (files.value.some((file) => file.path === path)) return children
  return (
    <Failure
      message={describeNotesFailure(
        { code: "notes.file.not_found" },
        "This file does not exist in the vault now."
      )}
    />
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
  const [load] = useState(() => () => source.files(connectionId))
  const files = useRead(load, "The files of this vault could not load.")
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
        <FileListPanel files={files} />
        {path === null ? (
          <p className="text-body text-muted-foreground">
            Select a file to read it.
          </p>
        ) : (
          <ListedFile files={files} path={path}>
            <FilePanel
              connectionId={connectionId}
              key={path}
              path={path}
              source={source}
            />
          </ListedFile>
        )}
      </div>
    </section>
  )
}
