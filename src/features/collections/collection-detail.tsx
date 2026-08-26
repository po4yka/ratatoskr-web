/* eslint-disable max-lines -- collection detail pairs management and ordered items in one route view. */
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FixtureIntegrationNotice } from "@/features/collections/fixture-notice"
import type {
  CurationCollection,
  CurationCommand,
  CurationSnapshot,
} from "@/features/collections/curation-source"

interface CollectionDetailProps {
  readonly collection: CurationCollection
  readonly error: string | null
  readonly mutate: (
    command: CurationCommand
  ) => Promise<CurationSnapshot | null>
  readonly snapshot: CurationSnapshot
}

export function CollectionDetail({
  collection,
  error,
  mutate,
  snapshot,
}: CollectionDetailProps) {
  const [name, setName] = useState(collection.name)
  const navigate = useNavigate()

  async function deleteCollection() {
    const result = await mutate({
      kind: "delete-collection",
      collectionId: collection.id,
    })
    if (result) navigate("/collections")
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <Link
        className="text-body text-muted-foreground hover:underline"
        to="/collections"
      >
        Back to collections
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-heading-sm font-semibold">{collection.name}</h1>
        <p className="text-body text-muted-foreground">
          Ordered fixture items stay in the order the source supplied.
        </p>
      </header>
      <FixtureIntegrationNotice />
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <label className="flex flex-col gap-1.5" htmlFor="collection-name">
          <span className="text-caption font-medium">Collection name</span>
          <Input
            id="collection-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            disabled={!name.trim()}
            onClick={() =>
              void mutate({
                kind: "rename-collection",
                collectionId: collection.id,
                name: name.trim(),
              })
            }
            variant="outline"
          >
            Save name
          </Button>
          <DeleteCollection
            collection={collection}
            onDelete={deleteCollection}
          />
        </div>
      </section>
      {error ? (
        <p className="text-body text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <CollectionItems
        collection={collection}
        mutate={mutate}
        snapshot={snapshot}
      />
    </section>
  )
}

function DeleteCollection({
  collection,
  onDelete,
}: {
  readonly collection: CurationCollection
  readonly onDelete: () => Promise<void>
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete collection
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {collection.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete {collection.name} and remove its saved item list. The archive
            records themselves stay unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep collection</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onDelete()}
            variant="destructive"
          >
            Delete {collection.name}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CollectionItems({
  collection,
  mutate,
  snapshot,
}: {
  readonly collection: CurationCollection
  readonly mutate: (
    command: CurationCommand
  ) => Promise<CurationSnapshot | null>
  readonly snapshot: CurationSnapshot
}) {
  const items = collection.itemIds.flatMap((id) =>
    snapshot.documents.filter((document) => document.id === id)
  )
  const available = snapshot.documents.filter(
    (document) => !collection.itemIds.includes(document.id)
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="text-subheading font-semibold">Items</h2>
        <ul
          aria-label="Collection items"
          className="mt-3 flex flex-col gap-3"
          role="list"
        >
          {items.map((item) => (
            <li
              className="flex items-center justify-between gap-3"
              key={item.id}
            >
              <span className="text-body">{item.title}</span>
              <Button
                onClick={() =>
                  void mutate({
                    kind: "remove-item",
                    collectionId: collection.id,
                    documentId: item.id,
                  })
                }
                size="sm"
                variant="outline"
              >
                Remove {item.title}
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 shadow-subtle">
        <h2 className="text-subheading font-semibold">Available items</h2>
        <ul className="mt-3 flex flex-col gap-3" role="list">
          {available.map((item) => (
            <li
              className="flex items-center justify-between gap-3"
              key={item.id}
            >
              <span className="text-body">{item.title}</span>
              <Button
                onClick={() =>
                  void mutate({
                    kind: "add-item",
                    collectionId: collection.id,
                    documentId: item.id,
                  })
                }
                size="sm"
                variant="outline"
              >
                Add {item.title}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
