import type { ArchiveDocument } from "@/features/search/archive-source"
import type { ReaderPreferences } from "@/features/reader/reader-preferences"

export function ReaderContent({
  document,
  preferences,
}: {
  document: ArchiveDocument
  preferences: ReaderPreferences
}) {
  return (
    <article
      className={`mx-auto w-full ${readerTextClass(preferences.fontScale)}`}
      data-reader-content
      data-reader-font={preferences.fontFamily}
      data-reader-line-height={preferences.lineHeight}
      data-reader-measure={preferences.measure}
    >
      {document.blocks.map((block, index) => {
        if (block.type === "heading")
          return (
            <h2 className="mt-8 text-heading-sm font-semibold" key={index}>
              {block.text}
            </h2>
          )
        if (block.type === "quote")
          return (
            <blockquote
              className="mt-5 border-l-2 border-foreground pl-4 text-body-lg"
              key={index}
            >
              {block.text}
            </blockquote>
          )
        if (block.type === "list")
          return (
            <ul className="mt-5 list-disc space-y-2 pl-6" key={index}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        return (
          <p className="mt-5" key={index}>
            {block.text}
          </p>
        )
      })}
    </article>
  )
}

export function ReaderEvidence({ document }: { document: ArchiveDocument }) {
  return (
    <section
      aria-labelledby="provenance"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <h2 className="text-subheading font-semibold" id="provenance">
        Provenance
      </h2>
      <dl className="mt-3 grid gap-3 text-body sm:grid-cols-2">
        <div>
          <dt className="text-caption text-muted-foreground">Source</dt>
          <dd className="mt-1 break-all">
            <a
              className="underline-offset-4 hover:underline"
              href={document.sourceAddress}
            >
              {document.sourceAddress}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted-foreground">
            Extraction path
          </dt>
          <dd className="mt-1">{document.extractionPath}</dd>
        </div>
      </dl>
      {document.warnings.length ? (
        <section aria-labelledby="extraction-warnings" className="mt-5">
          <h3 className="text-body font-semibold" id="extraction-warnings">
            Extraction warnings
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-muted-foreground">
            {document.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}

export function ReaderAnalysis({ document }: { document: ArchiveDocument }) {
  if (!document.analysis)
    return (
      <section
        className="rounded-xl border border-border bg-card p-5 shadow-subtle"
        role="status"
      >
        Analysis is not available for this document.
      </section>
    )
  return (
    <section
      aria-labelledby="analysis"
      className="rounded-xl border border-border bg-card p-5 shadow-subtle"
    >
      <h2 className="text-subheading font-semibold" id="analysis">
        TLDR
      </h2>
      <p className="mt-2 text-body-lg">{document.analysis.tldr}</p>
      <h3 className="mt-5 text-body font-semibold">Key points</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-body">
        {document.analysis.keyPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  )
}

export function ReaderTags({ tags }: { tags: readonly string[] }) {
  return (
    <section aria-labelledby="document-tags">
      <h2 className="text-subheading font-semibold" id="document-tags">
        Tags
      </h2>
      <ul className="mt-3 flex flex-wrap gap-2" role="list">
        {tags.map((tag) => (
          <li
            className="rounded-lg bg-muted px-2 py-0.5 text-caption"
            key={tag}
          >
            {tag}
          </li>
        ))}
      </ul>
    </section>
  )
}

function readerTextClass(fontScale: ReaderPreferences["fontScale"]): string {
  return {
    default: "max-w-3xl text-body-lg",
    large: "max-w-3xl text-subheading",
    xlarge: "max-w-3xl text-heading-sm",
  }[fontScale]
}
