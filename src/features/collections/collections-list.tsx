import { Link, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FixtureIntegrationNotice } from "@/features/collections/fixture-notice"
import {
  collectionIdFor,
  type CurationSnapshot,
} from "@/features/collections/curation-source"
import { useState } from "react"

interface CollectionsListProps {
  readonly error: string | null
  readonly onCreate: (name: string) => Promise<unknown>
  readonly snapshot: CurationSnapshot
}

export function CollectionsList({
  error,
  onCreate,
  snapshot,
}: CollectionsListProps) {
  const [name, setName] = useState("")
  const navigate = useNavigate()

  async function create() {
    const trimmed = name.trim()
    if (!trimmed) return
    const created = await onCreate(trimmed)
    if (!created) return
    setName("")
    navigate(`/collections/${collectionIdFor(trimmed)}`)
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">Collections</h1>
        <p className="text-body text-muted-foreground">
          Keep an intentional reading list without hiding where each record came
          from.
        </p>
      </header>
      <FixtureIntegrationNotice />
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <label className="flex flex-col gap-1.5" htmlFor="new-collection-name">
          <span className="text-caption font-medium">New collection name</span>
          <Input
            id="new-collection-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <Button
          className="mt-3"
          disabled={!name.trim()}
          onClick={() => void create()}
        >
          Create collection
        </Button>
      </section>
      {error ? <MutationError message={error} /> : null}
      {snapshot.collections.length ? (
        <ul className="flex flex-col gap-3" role="list">
          {snapshot.collections.map((collection) => (
            <li
              className="rounded-xl border border-border bg-card p-5 shadow-subtle"
              key={collection.id}
            >
              <Link
                className="text-subheading font-semibold hover:underline"
                to={`/collections/${collection.id}`}
              >
                {collection.name}
              </Link>
              <p className="mt-2 text-body text-muted-foreground">
                {collection.itemIds.length} saved{" "}
                {collection.itemIds.length === 1 ? "item" : "items"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <section
          className="rounded-xl border border-border bg-card p-5 shadow-subtle"
          role="status"
        >
          <h2 className="text-subheading font-semibold">No collections yet</h2>
          <p className="mt-2 text-body text-muted-foreground">
            Create one to begin a focused reading list.
          </p>
        </section>
      )}
    </section>
  )
}

function MutationError({ message }: { readonly message: string }) {
  return (
    <p className="text-body text-destructive" role="alert">
      {message}
    </p>
  )
}
