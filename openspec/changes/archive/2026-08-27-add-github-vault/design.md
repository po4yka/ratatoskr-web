## Context

See proposal.md and `github-vault-catalog/spec.md`. The pinned generated Edge
schema has no GitHub catalog, Git Vault, OAuth-start, or corresponding
capability operation. The previous fixture-backed collections slice already
separates an in-memory source from its React views and labels the result as
integration-pending. Existing routing applies one capability gate to both
navigation and a direct route; existing generated `AlertDialog` composition
supplies accessible, focus-managed confirmation.

The workspace `repository-analysis-intake` specification makes analysis a
server-owned, revision-bound fact. The web client will display only the
analysis projection supplied by its source; it will not compute a score,
sparkline, queue state, or completion itself.

## Goals / Non-Goals

**Goals:**

- Keep GitHub and vault data-source seams small enough to replace with typed
  Edge calls without rewriting presentation.
- Treat PAT input as transient form state and provide no client-side OAuth
  code verifier or callback handling until Platform defines that facade.
- Make every source result state readable and keyboard-operable in the
  established shell, card, type, token, and confirmation patterns.

**Non-Goals:**

- Star-list management beyond visible membership, watch configuration, mirror
  execution, backup verification, provider-token custody, OAuth callback
  processing, sparklines, queue/history management, or live API calls.
- Any generated-contract update, new capability negotiation scheme, provider
  direct request, third-party connection, or storage access.

## Decisions

### Use one contract-fixed fixture source and a narrow source interface

`src/features/github-vault/github-vault-source.ts` will own fixture projection
types, immutable example data, `read`, PAT connection, optional authorization
URL, and explicit catalog mutations. The page owns only loading/error/retry
state, and leaf components receive data plus callbacks. This mirrors the
curation seam while keeping the fixture contract local and readily replaceable
by generated Edge types.

The source's fixture marker is part of the snapshot, not an assumption in a
view. Each route therefore labels integration pending whenever it renders the
fixture source. The alternative — mock an absent gateway endpoint — would
make an invented API look live and violates the generated-types boundary.

### Gate routes using fixture-declared capability names only in the fixture seam

The implementation will add the two fixture capability names to the closed
client vocabulary and register GitHub and vault routes with them. Tests will
provide those values through the existing capability document seam; absent
values must reach the existing explained-absence route. Their names and all
write payloads remain fixture-only until a workspace changeset supplies the
Edge contract and generated vocabulary, at which point a dedicated contract
regeneration change replaces them.

This is preferable to leaving fixture routes ungated: it exercises the
existing server-driven gate and prevents a future live route from inheriting
an untested absence path. It does not claim that the fixture names are a
published Platform contract.

### Keep PAT and PKCE at the Platform boundary

The PAT form uses a labelled password input and local non-empty validation.
It passes its value once to `connectPat`, clears local state in a `finally`
path, and neither reads nor writes browser storage. The fixture source returns
only a redacted connection status. When the snapshot supplies an
authorization URL, the UI exposes a normal provider navigation; it never
constructs a URL, state, verifier, or callback. The absence of that supplied
URL renders a concise explanation rather than a disabled OAuth control.

This preserves the rule that provider credentials never reach durable browser
storage and leaves PKCE ownership with the future Edge facade. A browser-built
PKCE flow was rejected because it would require unpublished redirect, state,
and token-exchange contracts.

### Require explicit intent before each mutable catalog action

Repository cards offer readable track/untrack and star/unstar actions, but
the mutation callback is held pending until an `AlertDialog` names the
repository and its exact effect. Cancel or dismissal discards the pending
command. Confirmation invokes the source exactly once; a source failure keeps
the prior snapshot and reports a recoverable error. The confirmation action is
not initial focus and its wording, rather than Ember alone, conveys impact.

The first fixture version does not pretend to attach an idempotency header; no
Edge write exists. Its integration-pending notice names idempotency and server
capability checking as contract prerequisites.

### Render supplied Git Vault evidence as facts, never as a health inference

The vault route groups snapshots under their supplied mirror, prints each
manifest digest verbatim, and selects a drill evidence panel from the supplied
record. A pass renders "restore verified" only when `outcome` is explicitly
passing; failure and missing evidence retain their own stated outcomes. The
view uses text labels, times, durations, and status labels — no colour or
chart determines meaning. There are no client-generated sparklines, health
scores, queue depth, or restore verdicts.

## Risks / Trade-offs

- [Fixture shapes drift from eventual Edge projections] → keep them isolated,
  label integration pending, and replace them only in a reviewed contract
  regeneration/workspace changeset.
- [A PAT leaks through visible UI or state] → use password input, never echo
  the value, clear it after submission, and add tests that assert no token is
  present in the outcome.
- [A write fires through a stray click] → retain a pending command only in the
  confirmation composition and test both cancellation and confirmation.
- [A failed drill looks healthy] → require explicit passing evidence for the
  verified label and test a failure fixture independently.
- [Large catalog/mirror lists overload a first route] → fixture projections
  remain bounded; future Edge integration must use its contract pagination
  rather than browser-side unbounded fetches.

## Migration Plan

1. Add the fixture-backed routes behind their fixture capability gate and
   publish the integration-pending notice.
2. When the workspace contract declares the GitHub and vault Edge operations,
   capability names, idempotent writes, and OAuth facade, create a separate
   workspace change followed by a generated-type refresh commit in Web.
3. Replace the fixture source with generated gateway calls and retain the same
   loading, absence, consent, and evidence tests against a local mock.
4. Roll back by removing the two navigation entries and routes; no fixture
   mutation is durable and all live provider and vault state remains owned by
   Platform services.
