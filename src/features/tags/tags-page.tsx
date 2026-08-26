/* eslint-disable max-lines -- the small fixture page keeps its curation controls together. */
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FixtureIntegrationNotice } from "@/features/collections/fixture-notice"
import {
  createFixtureCurationSource,
  tagMergePreview,
  type CurationSnapshot,
  type CurationSource,
  type CurationTag,
} from "@/features/collections/curation-source"
import { useCuration } from "@/features/collections/curation-state"

interface TagsPageProps {
  readonly source?: CurationSource
}

export default function TagsPage({ source }: TagsPageProps) {
  const fixtureSource = useMemo(() => createFixtureCurationSource(), [])
  const curation = useCuration(source ?? fixtureSource)
  if (!curation.snapshot)
    return <TagsPending error={curation.error} onRetry={curation.retry} />

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">Tags</h1>
        <p className="text-body text-muted-foreground">
          Use concise names to keep your archive filters legible.
        </p>
      </header>
      <FixtureIntegrationNotice />
      {curation.error ? (
        <p className="text-body text-destructive" role="alert">
          {curation.error}
        </p>
      ) : null}
      <TagList mutate={curation.mutate} snapshot={curation.snapshot} />
      <MergePanel mutate={curation.mutate} snapshot={curation.snapshot} />
    </section>
  )
}

function TagList({
  mutate,
  snapshot,
}: {
  readonly mutate: ReturnType<typeof useCuration>["mutate"]
  readonly snapshot: CurationSnapshot
}) {
  return (
    <section aria-label="Tags" className="grid gap-3 sm:grid-cols-2">
      {snapshot.tags.map((tag) => (
        <TagCard key={tag.id} mutate={mutate} snapshot={snapshot} tag={tag} />
      ))}
    </section>
  )
}

function TagCard({
  mutate,
  snapshot,
  tag,
}: {
  readonly mutate: ReturnType<typeof useCuration>["mutate"]
  readonly snapshot: CurationSnapshot
  readonly tag: CurationTag
}) {
  const [name, setName] = useState(tag.name)
  const count = snapshot.documents.filter((document) =>
    document.tagIds.includes(tag.id)
  ).length

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <p className="text-body">
        {tag.name} — {count} {count === 1 ? "record" : "records"}
      </p>
      <label
        className="mt-3 flex flex-col gap-1.5"
        htmlFor={`rename-${tag.id}`}
      >
        <span className="text-caption font-medium">Rename {tag.name}</span>
        <Input
          id={`rename-${tag.id}`}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>
      <Button
        className="mt-3"
        disabled={!name.trim()}
        onClick={() =>
          void mutate({ kind: "rename-tag", tagId: tag.id, name: name.trim() })
        }
        variant="outline"
      >
        Save {tag.name}
      </Button>
    </article>
  )
}

// eslint-disable-next-line complexity -- derived valid selections keep a merge preview safe after mutations.
function MergePanel({
  mutate,
  snapshot,
}: {
  readonly mutate: ReturnType<typeof useCuration>["mutate"]
  readonly snapshot: CurationSnapshot
}) {
  const [sourceTagId, setSourceTagId] = useState("")
  const [targetTagId, setTargetTagId] = useState("")
  const [first, second] = snapshot.tags
  const sourceId = snapshot.tags.some((tag) => tag.id === sourceTagId)
    ? sourceTagId
    : (first?.id ?? "")
  const targetId = snapshot.tags.some((tag) => tag.id === targetTagId)
    ? targetTagId
    : (second?.id ?? first?.id ?? "")
  const preview = tagMergePreview(snapshot, sourceId, targetId)

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
      <h2 className="text-subheading font-semibold">Merge tags</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Move every fixture record from one tag into another after reviewing the
        result.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TagSelect
          id="merge-source"
          label="Source tag"
          onChange={setSourceTagId}
          tags={snapshot.tags}
          value={sourceId}
        />
        <TagSelect
          id="merge-target"
          label="Target tag"
          onChange={setTargetTagId}
          tags={snapshot.tags}
          value={targetId}
        />
      </div>
      {preview ? (
        <MergePreview preview={preview} />
      ) : (
        <p className="mt-4 text-body text-muted-foreground">
          Select two distinct tags to preview a merge.
        </p>
      )}
      <Button
        className="mt-4"
        disabled={!preview}
        onClick={() =>
          preview &&
          void mutate({
            kind: "merge-tags",
            sourceTagId: sourceId,
            targetTagId: targetId,
          })
        }
        variant="destructive"
      >
        Merge {preview?.sourceName ?? "source"} into{" "}
        {preview?.targetName ?? "target"}
      </Button>
    </section>
  )
}

function TagSelect({
  id,
  label,
  onChange,
  tags,
  value,
}: {
  readonly id: string
  readonly label: string
  readonly onChange: (value: string) => void
  readonly tags: readonly CurationTag[]
  readonly value: string
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-caption font-medium">{label}</span>
      <select
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-body outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function MergePreview({
  preview,
}: {
  readonly preview: NonNullable<ReturnType<typeof tagMergePreview>>
}) {
  return (
    <section className="mt-4" aria-label="Merge preview">
      <p className="text-body">
        {preview.targetName} will contain {preview.resultingCount}{" "}
        {preview.resultingCount === 1 ? "record" : "records"}.
      </p>
      <ul className="mt-2 text-body text-muted-foreground" role="list">
        {preview.affectedDocumentIds.map((id) => (
          <li key={id}>
            {id === "document-ir"
              ? "Document IR: Evidence at the Boundary"
              : id}
          </li>
        ))}
      </ul>
    </section>
  )
}

function TagsPending({
  error,
  onRetry,
}: {
  readonly error: string | null
  readonly onRetry: () => void
}) {
  return error ? (
    <section className="p-6">
      <p role="alert">{error}</p>
      <button onClick={onRetry}>Try again</button>
    </section>
  ) : (
    <section className="p-6" role="status">
      Loading tags
    </section>
  )
}
