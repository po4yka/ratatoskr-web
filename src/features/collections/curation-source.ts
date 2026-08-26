/* eslint-disable max-lines -- fixture projection and pure mutation invariants stay co-located. */
export interface CurationDocument {
  readonly id: string
  readonly title: string
  readonly tagIds: readonly string[]
}

export interface CurationCollection {
  readonly id: string
  readonly name: string
  readonly itemIds: readonly string[]
}

export interface CurationTag {
  readonly id: string
  readonly name: string
}

export interface CurationSnapshot {
  readonly collections: readonly CurationCollection[]
  readonly documents: readonly CurationDocument[]
  readonly tags: readonly CurationTag[]
}

export type CurationCommand =
  | { kind: "create-collection"; name: string }
  | { kind: "rename-collection"; collectionId: string; name: string }
  | { kind: "delete-collection"; collectionId: string }
  | { kind: "add-item"; collectionId: string; documentId: string }
  | { kind: "remove-item"; collectionId: string; documentId: string }
  | { kind: "rename-tag"; tagId: string; name: string }
  | { kind: "merge-tags"; sourceTagId: string; targetTagId: string }

export interface CurationSource {
  read(): Promise<CurationSnapshot>
  mutate(command: CurationCommand): Promise<CurationSnapshot>
}

export interface TagMergePreview {
  readonly affectedDocumentIds: readonly string[]
  readonly resultingCount: number
  readonly sourceName: string
  readonly targetName: string
}

export const fixtureCurationSnapshot: CurationSnapshot = {
  collections: [{ id: "reading", name: "Reading", itemIds: ["document-ir"] }],
  documents: [
    {
      id: "document-ir",
      title: "Document IR: Evidence at the Boundary",
      tagIds: ["contracts", "provenance", "reader"],
    },
    {
      id: "search-evidence",
      title: "Search Results Need Match Evidence",
      tagIds: ["search", "evidence"],
    },
  ],
  tags: [
    { id: "contracts", name: "contracts" },
    { id: "provenance", name: "provenance" },
    { id: "reader", name: "reader" },
    { id: "search", name: "search" },
    { id: "evidence", name: "evidence" },
  ],
}

export function applyOptimistic(
  snapshot: CurationSnapshot,
  command: CurationCommand
): CurationSnapshot {
  switch (command.kind) {
    case "create-collection":
      return {
        ...snapshot,
        collections: [
          ...snapshot.collections,
          {
            id: collectionIdFor(command.name),
            name: command.name,
            itemIds: [],
          },
        ],
      }
    case "rename-collection":
      return mapCollection(snapshot, command.collectionId, (collection) => ({
        ...collection,
        name: command.name,
      }))
    case "delete-collection":
      return {
        ...snapshot,
        collections: snapshot.collections.filter(
          (collection) => collection.id !== command.collectionId
        ),
      }
    case "add-item":
      return mapCollection(snapshot, command.collectionId, (collection) => ({
        ...collection,
        itemIds: addUnique(collection.itemIds, command.documentId),
      }))
    case "remove-item":
      return mapCollection(snapshot, command.collectionId, (collection) => ({
        ...collection,
        itemIds: collection.itemIds.filter((id) => id !== command.documentId),
      }))
    case "rename-tag":
      return {
        ...snapshot,
        tags: snapshot.tags.map((tag) =>
          tag.id === command.tagId ? { ...tag, name: command.name } : tag
        ),
      }
    case "merge-tags":
      return mergeTags(snapshot, command.sourceTagId, command.targetTagId)
  }
}

// eslint-disable-next-line max-params -- source and target identify one merge preview.
export function tagMergePreview(
  snapshot: CurationSnapshot,
  sourceTagId: string,
  targetTagId: string
): TagMergePreview | null {
  const source = snapshot.tags.find((tag) => tag.id === sourceTagId)
  const target = snapshot.tags.find((tag) => tag.id === targetTagId)
  if (!source || !target || source.id === target.id) return null

  const affectedDocumentIds = snapshot.documents
    .filter((document) => document.tagIds.includes(source.id))
    .map((document) => document.id)
  const resultingCount = snapshot.documents.filter((document) =>
    document.tagIds.some((id) => id === source.id || id === target.id)
  ).length

  return {
    affectedDocumentIds,
    resultingCount,
    sourceName: source.name,
    targetName: target.name,
  }
}

export class CurationController {
  private readonly source: CurationSource
  private snapshotValue: CurationSnapshot

  constructor(source: CurationSource, initialSnapshot: CurationSnapshot) {
    this.source = source
    this.snapshotValue = initialSnapshot
  }

  snapshot(): CurationSnapshot {
    return this.snapshotValue
  }

  async run(command: CurationCommand): Promise<CurationSnapshot> {
    const previous = this.snapshotValue
    this.snapshotValue = applyOptimistic(previous, command)
    try {
      this.snapshotValue = await this.source.mutate(command)
      return this.snapshotValue
    } catch (error) {
      this.snapshotValue = previous
      throw error
    }
  }
}

export function createFixtureCurationSource(
  initialSnapshot: CurationSnapshot = fixtureCurationSnapshot
): CurationSource {
  let snapshot = initialSnapshot
  return {
    async read() {
      return snapshot
    },
    async mutate(command) {
      snapshot = applyOptimistic(snapshot, command)
      return snapshot
    },
  }
}

function addUnique(
  values: readonly string[],
  value: string
): readonly string[] {
  return values.includes(value) ? values : [...values, value]
}

export function collectionIdFor(name: string): string {
  return `collection-${name
    .toLocaleLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")}`
}

// eslint-disable-next-line max-params -- the transformer is the mutation payload for one collection.
function mapCollection(
  snapshot: CurationSnapshot,
  collectionId: string,
  map: (collection: CurationCollection) => CurationCollection
): CurationSnapshot {
  return {
    ...snapshot,
    collections: snapshot.collections.map((collection) =>
      collection.id === collectionId ? map(collection) : collection
    ),
  }
}

// eslint-disable-next-line max-params -- source and target identify one merge operation.
function mergeTags(
  snapshot: CurationSnapshot,
  sourceTagId: string,
  targetTagId: string
): CurationSnapshot {
  if (sourceTagId === targetTagId) return snapshot
  return {
    ...snapshot,
    documents: snapshot.documents.map((document) => ({
      ...document,
      tagIds: document.tagIds.includes(sourceTagId)
        ? addUnique(
            document.tagIds.filter((id) => id !== sourceTagId),
            targetTagId
          )
        : document.tagIds,
    })),
    tags: snapshot.tags.filter((tag) => tag.id !== sourceTagId),
  }
}
