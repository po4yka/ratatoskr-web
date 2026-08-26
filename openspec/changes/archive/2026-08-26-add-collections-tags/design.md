## Context

See `proposal.md` for motivation and the delta specs for behaviour. The
existing search/reader slice already uses an injectable fixture source because
the generated Edge API has no Knowledge search/read routes. That same contract
also has no collection, tag, merge, or user-content capability vocabulary.
`docs/parity-prompts/knowledge.md` prompt 6 still says the proposed Knowledge
ownership requires explicit owner approval.

## Goals / Non-Goals

**Goals:**

- Keep curation projection types and harness-only mutations behind one local
  source boundary that can be replaced wholesale by generated contract types.
- Exercise list/detail curation and tag merge behaviour through accessible UI
  flows, including pending, error, empty, and optimistic rollback states.
- Keep the tag filter as the sole source of truth in the existing search URL.

**Non-Goals:**

- No guessed Edge path, browser-owned wire type, generated-schema edit, or
  production capability name.
- No local persistence of curation mutations; fixtures are demonstrative and
  must not resemble successful server writes.
- No nested or smart collections, public links, collaborators, or any
  server-side ownership/domain work.

## Decisions

### A CurationSource is an injectable fixture boundary

`src/features/collections/curation-source.ts` will define view projections and
one source interface for collection snapshots, tag snapshots, and mutation
commands. The default source will hold deterministic fixture data; tests will
inject an independently scripted source that can delay or reject one command.
The source is not an Edge client and does not use the gateway.

Alternative: add provisional requests to the existing gateway. Rejected
because public paths and request/response types must be generated from the
fixed contract, not inferred from a legacy surface.

### Optimistic state belongs in a small curation controller

A narrow hook/controller will hold the last server-equivalent snapshot,
calculate a pure optimistic snapshot for a command, publish it immediately,
and replace it with the source result or restore the prior snapshot on
rejection. A failed mutation stays distinct from an empty collection/tag list.
The UI will not claim persistence; each fixture page shows integration pending.

Alternative: mutate each component's local arrays. Rejected because rollback
would be duplicated, inconsistent between create/delete/merge/item operations,
and impossible to test as one policy.

### Routes are added, but server capability gates are explicitly deferred

`/collections`, `/collections/:collectionId`, and `/tags` are protected,
lazy-loaded fixture routes. They are not assigned a `requires` capability:
adding an ungenerated name to the closed `CapabilityName` union would make the
client claim a server contract that does not exist. The existing capability
registry remains the single place future generated names will be wired once a
workspace changeset lands.

Alternative: use a fixture-only `collections.manage`/`tags.manage` capability
name. Rejected because it would silently establish a false public vocabulary.

### Search owns URL tag normalization

The existing pure search-state module gains an optional `tag` value and its
serializer. The fixture archive source owns the valid tag list and applies the
filter before pagination. Search controls render only those source-declared
fixture tags, so changing or clearing a tag is normal navigation rather than a
second piece of local state.

Alternative: filter result rows after search returns. Rejected because page
counts and back/forward navigation could then disagree with the address.

### Merge preview comes from a pure projection

The tags view derives a preview from the current curation snapshot: source and
target names, affected fixture records, de-duplicated target count, and an
explicitly disabled confirmation for an invalid pair. The mutation is separate
from the preview, so it can be tested without a UI click and cannot merge the
same tag into itself.

Alternative: let the harness return an opaque preview. Rejected because the
fixture slice needs a deterministic executable behavioural contract while no
server endpoint exists.

## Risks / Trade-offs

- [Fixture projection differs from the future service] → Keep all data models
  behind the source interface, label every view integration pending, and
  replace the source only when generated types arrive.
- [Optimistic snapshot misses an invariant] → Cover create/delete/item/merge
  command failures with scripted rejection tests and derive all projections
  from one snapshot.
- [Users mistake a fixture mutation for saved archive data] → Display the
  pending integration notice near every curation mutation surface and avoid
  browser persistence.
- [Capability integration is incomplete] → Preserve the existing registry and
  record the exact missing input: an owner-approved user-content domain and
  generated Edge capability vocabulary.

## Migration Plan

1. Ship the fixture-only curation routes and their explicit pending state.
2. After a workspace changeset publishes collection/tag operations and
   capability names, regenerate types in its own commit and replace the source
   implementation with a gateway adapter.
3. Attach the generated capability names to navigation and route entries, then
   retain the current projection and rollback tests against contract harnesses.
4. If the fixture slice regresses before integration, remove the route module;
   it owns no server data or browser-persisted mutations.
