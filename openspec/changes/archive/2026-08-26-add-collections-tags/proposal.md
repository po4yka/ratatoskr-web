## Why

The archive reader can show tags but cannot yet curate its content. A first
collections-and-tags surface makes manual organisation visible and testable
without pretending that an unpublished Knowledge domain is already an Edge
API.

## What Changes

- Add fixture-backed collection list and detail views with creation, rename,
  confirmed deletion, and ordered item add/remove operations.
- Add a fixture-backed tags overview with counts, rename, merge preview, and
  merge execution.
- Add tag selection to the search URL and use it to filter fixture results;
  collection membership can be added from result lists.
- Add deterministic optimistic mutation handling with rollback on a rejected
  fixture-harness operation.
- Show that Edge integration and server-declared collection/tag capability
  gates are pending. The pinned API contract has neither the required
  operations nor capability vocabulary, so this change adds no guessed wire
  types, paths, or production capability names.
- Record nested collections, smart collections, public links, and
  collaborators as deferred server-side work.

## Capabilities

### New Capabilities

- `collections-tags`: Fixture-projected archive curation, including collections,
  tags, merge review, URL-addressable tag filtering, and truthful pending
  integration status.

### Modified Capabilities

- `archive-search-reader`: Search result filtering gains an optional,
  URL-addressable fixture tag constraint.

## Impact

- Affects the fixture archive source, search state and controls, protected
  route tree and navigation, curation views, and component/integration tests.
- Does not change the generated Platform API contract, call the gateway on an
  undeclared path, or add a dependency.
- Knowledge ownership remains unapproved in `docs/parity-prompts/knowledge.md`
  prompt 6; integration remains pending until a workspace changeset fixes the
  contract and declared capability names.
