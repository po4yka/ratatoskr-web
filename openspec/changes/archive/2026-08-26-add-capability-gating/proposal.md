## Why

The bundle cannot know what a self-hosted deployment runs; Platform answers that through
`GET /v1/capabilities`, and the repository invariant is that the client renders what exists and
explains what does not — never a dead control. The shell shipped in the previous slice hard-codes
its navigation and route tree, and nothing reads the capability document even though the boot probe
already proved the endpoint cheap and stable. Building the gating rules now, before any gated
feature lands, is plan item 5 in `docs/IMPLEMENTATION_PLAN.md` and prevents every later slice from
bolting on its own ad-hoc checks.

## What Changes

- Add capability discovery: for an authenticated session the client fetches the pinned-contract
  `CapabilityDocument` from `/v1/capabilities`, holds it in a capability context mounted around the
  protected shell, refreshes it on reconnect, and treats a failed read as its own state with an
  explicit retry — never as an answer about what the deployment can do.
- Add a typed gating helper: the closed vocabulary of capability names this client knows, a
  declaration of the capability each feature requires, and one total function from (requirement,
  document, load state) to a single verdict — available, pending, undecidable (deployment
  unreachable), or unavailable with the missing capability named.
- Drive shell navigation from a feature registry filtered through that verdict: an entry whose
  requirement is met renders; one whose requirement is missing, unknown-yet, or undecidable does
  not.
- Wrap feature routes in the gate: a direct URL into a route whose required capability is absent
  renders a truthful "not available in this deployment" state, distinct from not-found, from
  offline, and from pending.
- Cover the gating matrix with fixture capability documents: full vocabulary, empty vocabulary,
  partial documents, and documents carrying names this client has never heard of.

Out of scope: concrete gated feature pages (later implementation-plan items add their views WITH
their gates), the present-but-unconfigured experience, and any settings surface for capabilities.

## Capabilities

### New Capabilities

- `capability-gating`: The client learns what this deployment can do from Platform's capability
  document rather than assuming, decides feature availability through one typed rule, reflects the
  decision in navigation, and explains an absent capability truthfully instead of shipping a dead
  route.

### Modified Capabilities

None. The api-gateway and session-auth requirements are unchanged; this change consumes the
existing gateway injection point and the already-pinned `/v1/capabilities` path.

## Impact

- New code under `src/capabilities/` (vocabulary, gate evaluation, capability context, fixtures);
  edits to `src/App.tsx` (mount the context for authenticated sessions), `src/app/router.tsx`
  (route-level gate), `src/components/shell/shell.tsx` (registry-driven navigation), and
  `src/app/gate-surfaces.tsx` (the two new surfaces).
- No dependency changes; no contract regeneration — the path and the `CapabilityDocument` schema
  are already generated and `apiKeys.capabilities()` already pins the query key.
- One additional `GET /v1/capabilities` round trip per boot, accepted because the endpoint is the
  contract's designated cheap authenticated read; recorded in design as a deliberate trade.
