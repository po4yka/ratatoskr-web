import { useEffect, useState } from "react"
import { useParams } from "react-router"
import {
  fixtureArchiveSource,
  type ArchiveDocument,
  type ArchiveSource,
} from "@/features/search/archive-source"
import { ReaderDocument } from "@/features/reader/reader-document"
import { Button } from "@/components/ui/button"

interface ReaderPageProps {
  /** Local fixture seam until the generated Knowledge contract exists. */
  source?: ArchiveSource
}

type ReaderLoad =
  | { kind: "loading"; requestKey: string }
  | { kind: "ready"; document: ArchiveDocument; requestKey: string }
  | { kind: "missing"; requestKey: string }
  | { kind: "error"; requestKey: string }

export default function ReaderPage({
  source = fixtureArchiveSource,
}: ReaderPageProps) {
  const { documentId } = useParams()
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${documentId ?? "missing"}\u0000${attempt}`
  const [load, setLoad] = useState<ReaderLoad>({ kind: "loading", requestKey })
  const activeLoad: ReaderLoad =
    load.requestKey === requestKey ? load : { kind: "loading", requestKey }

  useEffect(() => {
    let current = true
    if (!documentId) return undefined
    source.read(documentId).then(
      (document) => {
        if (current)
          setLoad(
            document
              ? { kind: "ready", document, requestKey }
              : { kind: "missing", requestKey }
          )
      },
      () => {
        if (current) setLoad({ kind: "error", requestKey })
      }
    )
    return () => {
      current = false
    }
  }, [documentId, requestKey, source])

  if (!documentId || activeLoad.kind === "missing") return <ReaderMissing />
  if (activeLoad.kind === "loading") return <ReaderLoading />
  if (activeLoad.kind === "error") {
    return <ReaderError onRetry={() => setAttempt((value) => value + 1)} />
  }

  return <ReaderDocument document={activeLoad.document} />
}

function ReaderLoading() {
  return (
    <section
      aria-busy="true"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      role="status"
    >
      <h1 className="text-heading-sm font-semibold">Loading document</h1>
      <p className="mt-2 text-body text-muted-foreground">
        Reading the archived content and its evidence.
      </p>
    </section>
  )
}

function ReaderMissing() {
  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      role="status"
    >
      <h1 className="text-heading-sm font-semibold">
        Document is not available
      </h1>
      <p className="mt-2 text-body text-muted-foreground">
        This archive record is not in the current fixture source.
      </p>
    </section>
  )
}

function ReaderError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
      role="alert"
    >
      <h1 className="text-heading-sm font-semibold">Document could not load</h1>
      <p className="mt-2 text-body text-muted-foreground">
        The archive fixture did not answer. Try the request again.
      </p>
      <Button className="mt-4" onClick={onRetry} variant="outline">
        Try again
      </Button>
    </section>
  )
}
