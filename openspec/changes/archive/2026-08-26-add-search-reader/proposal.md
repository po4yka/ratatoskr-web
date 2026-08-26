## Why

The protected shell has a capability-gated Search entry but no way to find or
read archive content. Readers also need to see the extraction provenance and
warnings that qualify the content before treating it as trustworthy.

## What Changes

- Add a fixture-backed first version of archive search with URL-synchronised
  query, mode, and pagination state; highlighted snippets; match explanations;
  and honest loading, empty, and error states.
- Add a document reader route that renders Document IR-derived content, its
  provenance and extraction warnings, available analysis summary/key points,
  local reading settings, progress/resume, tag display, and mark-read/favorite
  actions.
- Record the missing Knowledge search/read Edge API contract as an integration
  dependency. Fixture payloads are limited to the web test seam until the
  workspace contract is published; this change does not add hand-written wire
  types or call an undeclared endpoint.
- Record intentionally deferred first-version parity work: anchored highlights,
  tag editing and suggestions, summary feedback, related reads,
  processing-results, PDF export, TTS, and search insights/trending.

## Capabilities

### New Capabilities

- `archive-search-reader`: Search and read fixture-projected archive documents
  while truthfully rendering provenance, extraction warnings, and partial
  analysis.

### Modified Capabilities

- None.

## Impact

- Affects the search feature, route tree, fixture-only data seam, reader UI,
  local preference/progress storage, and component/integration tests.
- Does not change the generated Platform API contract or add a dependency.
- Knowledge API integration remains pending on a workspace contract and live
  deployment or contract-fixed fixtures agreed by the owning repositories.
