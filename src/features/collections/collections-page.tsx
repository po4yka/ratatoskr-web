import { useMemo } from "react"
import { useParams } from "react-router"
import { CollectionDetail } from "@/features/collections/collection-detail"
import { CollectionsList } from "@/features/collections/collections-list"
import {
  createFixtureCurationSource,
  type CurationSource,
} from "@/features/collections/curation-source"
import { useCuration } from "@/features/collections/curation-state"

interface CollectionsPageProps {
  readonly source?: CurationSource
}

export default function CollectionsPage({ source }: CollectionsPageProps) {
  const fixtureSource = useMemo(() => createFixtureCurationSource(), [])
  const curation = useCuration(source ?? fixtureSource)
  const { collectionId } = useParams()

  if (!curation.snapshot) {
    return (
      <CollectionsPending error={curation.error} onRetry={curation.retry} />
    )
  }

  const collection = curation.snapshot.collections.find(
    (item) => item.id === collectionId
  )
  if (collectionId && collection) {
    return (
      <CollectionDetail
        collection={collection}
        error={curation.error}
        mutate={curation.mutate}
        snapshot={curation.snapshot}
      />
    )
  }

  return (
    <CollectionsList
      error={curation.error}
      onCreate={(name) => curation.mutate({ kind: "create-collection", name })}
      snapshot={curation.snapshot}
    />
  )
}

function CollectionsPending({
  error,
  onRetry,
}: {
  readonly error: string | null
  readonly onRetry: () => void
}) {
  if (error) {
    return (
      <section className="p-6">
        <p role="alert">{error}</p>
        <button onClick={onRetry}>Try again</button>
      </section>
    )
  }
  return (
    <section className="p-6" role="status">
      Loading collections
    </section>
  )
}
