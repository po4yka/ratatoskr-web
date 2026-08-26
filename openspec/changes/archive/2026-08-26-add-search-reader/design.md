## Context

The generated Edge API contract has no Knowledge search or document-read
operation, while the workspace Document IR and article-analysis specs define
the evidence the future service must provide. The shell has a lazy Search
route, a typed gateway, and capability gating, but its feature page is only a
placeholder. See `proposal.md` and the `archive-search-reader` delta for the
behaviour contract.

## Goals / Non-Goals

**Goals:**

- Deliver an accessible, fixture-projected first reader/search surface with
  deterministic state and complete non-happy-path rendering.
- Keep the future contract boundary narrow: feature projection types exist only
  behind an injectable fixture source and can be replaced wholesale when
  generated contract types arrive.
- Store only local presentation preferences and reading position; no archive
  body becomes authoritative client state.

**Non-Goals:**

- No guessed Edge API routes, hand-written network request/response shapes, or
  generated-contract changes.
- No legacy parity extensions: annotations, tag mutation/suggestions, feedback,
  related content, processing pane, PDF, TTS, search insights, or trending.
- No new dependency, router framework, state cache, or markdown HTML renderer.

## Decisions

### A fixture source is the boundary until Knowledge contracts are published

The feature gets search pages and document projections from a typed local
source interface, with deterministic fixtures used by production preview and
tests. It does not call the gateway for missing paths. This meets the explicit
fixture gate without converting a temporary frontend view model into a false
public API contract.

Alternative: manually add `/v1/search` and `/v1/documents/{id}` to a web
client. Rejected because generated types are the only permitted Edge API
shapes and that contract is owned across repositories.

### URL state is parsed and serialized in one pure module

Query, mode, and page normalization will be pure functions used by the route
and tested independently. Browser navigation is then the sole state update
mechanism, avoiding duplicated local and URL state.

Alternative: retain separate component state and write URL effects. Rejected
because back/forward and reload can drift from the rendered result set.

### Reader content uses typed Document IR projections, not raw markdown HTML

The reader will map supported headings, paragraphs, lists, and quotations into
React elements from fixture data. This preserves source text as text and makes
provenance/warnings a first-class adjacent region. A future contract adapter
will map generated payload types to this projection at the boundary.

Alternative: inject server markdown/HTML. Rejected because archive content is
untrusted and the first contract has no rendering format.

### Local state is namespaced, validated, and document-scoped

Settings will use one version-one browser key and an allowlisted parser;
progress uses a document-specific key and a clamped [0, 1] ratio. Reader
actions are fixture-local UI state, labelled as such until a generated mutation
contract exists.

Alternative: persist raw control values or absolute pixels. Rejected because
corrupt storage breaks rendering and absolute positions fail when layout
changes.

## Risks / Trade-offs

- [Fixture UI can diverge from the final service payload] → Keep projections
  isolated and mark the integration pending in proposal, design, and tasks;
  replace them from generated contract types in the follow-up changeset.
- [Long documents can change layout after progress is restored] → expose an
  explicit Resume action, calculate from current scroll range, and never claim
  an exact textual anchor.
- [Favorite/read actions might look server-authoritative] → keep them visibly
  local fixture state and do not persist or report mutation success.
- [A wide reader settings panel becomes a control wall] → use a labelled
  popover and retain the reading measure/type scale from `DESIGN.md`.

## Migration Plan

1. Ship this fixture-backed feature behind the existing Search route.
2. When the workspace contract and Platform deployment provide the operations,
   add a workspace changeset and generated types, then replace the fixture
   source with a gateway adapter while keeping projection tests.
3. If a fixture regression is found before that integration, remove the source
   injection from the route; no server state or migration needs rollback.

## Open Questions

- Which capabilities and endpoint shapes the Knowledge service will publish
  remain pending with the contract-owning repositories; resolving them requires
  a workspace changeset and is not safe to infer here.
