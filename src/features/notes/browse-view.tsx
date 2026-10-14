import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Failure, FilePanel } from "./file-panel"
import { fileLink, useRead } from "./notes-read"
import {
  describeNotesFailure,
  type NotesFile,
  type NotesSource,
} from "./notes-source"

interface FileList {
  readonly files: readonly NotesFile[]
  readonly cursor: string | null
}

function FileListPanel({
  source,
  connectionId,
}: {
  readonly source: NotesSource
  readonly connectionId: string
}) {
  const [load] = useState(() => () => source.files(connectionId))
  const first = useRead(load, "The files of this vault could not load.")
  const [more, setMore] = useState<FileList | null>(null)
  const [moreFailed, setMoreFailed] = useState<string | null>(null)
  if (first.kind === "loading") return <p role="status">Loading the files</p>
  if (first.kind === "failed") return <Failure message={first.message} />
  const list = more ?? {
    files: first.value.files,
    cursor: first.value.next_cursor ?? null,
  }
  if (list.files.length === 0)
    return (
      <p className="text-body text-muted-foreground">
        This vault has no files yet.
      </p>
    )

  async function showMore(cursor: string) {
    try {
      const page = await source.files(connectionId, cursor)
      setMore({
        files: [...list.files, ...page.files],
        cursor: page.next_cursor ?? null,
      })
    } catch (failure) {
      setMoreFailed(describeNotesFailure(failure, "More files could not load."))
    }
  }

  return (
    <nav aria-label="Vault files" className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {list.files.map((file) => (
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
      {list.cursor === null ? null : (
        <Button
          className="self-start"
          onClick={() => void showMore(list.cursor ?? "")}
          variant="outline"
        >
          Show more files
        </Button>
      )}
      {moreFailed ? <Failure message={moreFailed} /> : null}
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
