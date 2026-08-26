import { useEffect, useState } from "react"
import type { ArchiveDocument } from "@/features/search/archive-source"
import {
  readReaderPreferences,
  writeReaderPreferences,
  type ReaderPreferences,
} from "@/features/reader/reader-preferences"
import {
  progressForScroll,
  readProgress,
  resumeScrollTop,
  writeProgress,
} from "@/features/reader/reader-progress"
import { ReaderSettings } from "@/features/reader/reader-settings"
import {
  ReaderAnalysis,
  ReaderContent,
  ReaderEvidence,
  ReaderTags,
} from "@/features/reader/reader-details"
import { Button } from "@/components/ui/button"

export function ReaderDocument({ document }: { document: ArchiveDocument }) {
  const [preferences, setPreferences] = useState(readReaderPreferences)
  const [progress, setProgress] = useState(() => readProgress(document.id) ?? 0)
  const [read, setRead] = useState(false)
  const [favorite, setFavorite] = useState(false)

  useEffect(() => writeReaderPreferences(preferences), [preferences])

  useEffect(() => {
    const update = () => {
      const root = window.document.documentElement
      const value = progressForScroll(window.scrollY, {
        scrollHeight: root.scrollHeight,
        clientHeight: window.innerHeight,
      })
      setProgress(value)
      writeProgress(document.id, value)
    }
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [document.id])

  function resume() {
    const saved = readProgress(document.id)
    if (saved === null) return
    const root = window.document.documentElement
    window.scrollTo({
      top: resumeScrollTop(saved, {
        scrollHeight: root.scrollHeight,
        clientHeight: window.innerHeight,
      }),
      behavior: "auto",
    })
  }

  return (
    <section
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6"
      data-reader-theme={preferences.theme}
    >
      <header className="flex flex-col gap-3">
        <p className="text-caption font-medium text-muted-foreground">
          Archive document
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-heading font-semibold">{document.title}</h1>
          <ReaderActions
            favorite={favorite}
            onFavorite={() => setFavorite((value) => !value)}
            onRead={() => setRead((value) => !value)}
            preferences={preferences}
            read={read}
            setPreferences={setPreferences}
          />
        </div>
      </header>
      <section className="flex flex-wrap items-center gap-3 text-body text-muted-foreground">
        <p aria-live="polite">
          Reading progress: {Math.round(progress * 100)}%
        </p>
        {readProgress(document.id) !== null ? (
          <Button onClick={resume} variant="outline">
            Resume
          </Button>
        ) : null}
        <p className="text-caption">
          Actions are local to the fixture preview.
        </p>
      </section>
      <ReaderEvidence document={document} />
      <ReaderAnalysis document={document} />
      <ReaderContent document={document} preferences={preferences} />
      <ReaderTags tags={document.tags} />
    </section>
  )
}

function ReaderActions({
  favorite,
  onFavorite,
  onRead,
  preferences,
  read,
  setPreferences,
}: {
  favorite: boolean
  onFavorite: () => void
  onRead: () => void
  preferences: ReaderPreferences
  read: boolean
  setPreferences: (preferences: ReaderPreferences) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ReaderSettings onChange={setPreferences} preferences={preferences} />
      <Button aria-pressed={read} onClick={onRead} variant="outline">
        {read ? "Marked read" : "Mark as read"}
      </Button>
      <Button aria-pressed={favorite} onClick={onFavorite} variant="outline">
        {favorite ? "Favorited" : "Favorite"}
      </Button>
    </div>
  )
}
