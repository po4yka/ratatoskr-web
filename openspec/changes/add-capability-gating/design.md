## Context

The gateway (item 3) already owns token attach, retry, and normalized errors, and the session slice
(item 4) mounts `AuthProvider` around a router whose shell hard-codes two navigation entries
(search, collections) over two lazily loaded stub routes. `GET /v1/capabilities` is pinned in the
generated contract, returns the `CapabilityDocument` (`api_version`, sorted closed-vocabulary
`capabilities`, `minimum_client_versions`), and is authenticated like every `/v1` route — boot
already probes it for validity and discards the body. Platform's vocabulary today holds exactly
two names, `content.submit` and `telegram.mini_app`; neither matches a route family this client
serves yet, so every currently rendered surface is ungated and must remain visible regardless of
the document. ARCHITECTURE.md section 6 fixes the flow — boot → GET capabilities → capability
context → feature gating — and the rules: never infer from failure, explain absence, hide nothing
that exists.

## Goals / Non-Goals

Goals: one capability context mounted around the protected shell; one total, typed gating function;
navigation rendered from a feature registry through that function; route-level gate rendering a
truthful explained absence; the gating matrix proven against fixture documents.

Non-Goals: concrete gated feature pages (items 6–11 add views with their gates), the
present-but-unconfigured experience, capability administration surfaces, TanStack Query
integration.

## Decisions

### D1: A dedicated capability context, not an extension of the auth probe

`src/capabilities/capabilities-context.tsx` owns discovery: mounted only around the protected
shell, it reads `/v1/capabilities` through the injected gateway on mount, again when the browser
reports connectivity restored, and exposes `{ status: "loading" | "ready" | "failed", document,
retry }`. Alternative considered: thread the probe's discarded response body through
`provider.probe()` into auth state — rejected because the document serves navigation and routing,
not the session lifecycle, and threading it would grow the auth interface for a concern ARCHITECTURE.md
draws as its own box. Cost: one extra GET per boot of the endpoint the contract designates as the
cheap stable read; accepted deliberately. No request is sent while unauthenticated because the
context simply is not mounted there.

### D2: The client's vocabulary is a closed literal union

`src/capabilities/vocabulary.ts` declares `KNOWN_CAPABILITIES = ["content.submit",
"telegram.mini_app"]` and derives `CapabilityName` from it. A registry entry's `requires` field is
typed to that union, so a misspelled or not-yet-existing requirement fails compilation instead of
silently hiding a feature. Server names outside the union are ignored by construction — per the
contract, an unfamiliar name names a feature this client does not implement. When item 8 adds
capture, its gate extends this one union in one place. Alternative: accept any string — rejected;
it would let a typo become a permanently hidden feature, exactly the failure mode the typed helper
exists to prevent.

### D3: One total function, four verdicts

`evaluateGate(requires | undefined, status, document)` returns exactly one verdict:
`available`, `pending`, `undecidable`, or `{ state: "unavailable", missing }`. Ungated features map
to `available` in every load state. Gated features resolve `pending` while loading, `undecidable`
on failure (the client refuses to claim the deployment lacks something it could not ask),
`available`/`unavailable` from the held document otherwise. The distinction matters because each
verdict renders differently: pending holds the designed loading region, undecidable offers retry
with truthful copy, unavailable explains the deployment lacks the piece. This is the truthfulness
rule "distinguish offline, unauthenticated, unsupported" applied at gate level.

### D4: Navigation renders from a feature registry

`src/app/navigation.ts` holds the ordered entries — id, label, path, optional `requires`. The shell
maps entries to links filtered on `available`. A registry override prop mirrors the existing
`RouteModules` test seam so tests can mount real nav with fixture requirements without inventing
routes production will never serve. Entries without `requires` render in every load state, which
keeps today's two entries exactly where they are.

### D5: The route gate is a wrapper inside the existing route tree

`router.tsx` wraps each feature route's Suspense region in a small element that reads the entry for
its feature id, evaluates the gate, and switches between the view region, `RoutePending`, the
undecidable surface (with working retry), and the explained-absence surface. The catch-all
`RouteNotFound` stays untouched, keeping not-found and gated-away visibly distinct. Direct URL
entry hits the same wrapper, so deep links cannot bypass the gate — the state comes from the
context, not from how the user arrived.

### D6: Surfaces are composed, not generated

The two new states live beside `gate-surfaces.tsx`'s existing surfaces using semantic tokens and
the established type scale; no new shadcn component is needed, no dependency moves. Retry reuses
the context's explicit retry rather than inventing a second recovery path.

## Risks / Trade-offs

- [One extra capabilities round trip per boot] → Accepted; the contract describes the endpoint as
  cheap and stable, and deduplicating against the boot probe would couple auth and capability
  lifecycles the architecture keeps apart.
- [Gated nav stays hidden while the read is pending or failed] → Deliberate: rendering a control
  whose fate is unknown risks a dead click, which the invariant forbids outright. Ungated core
  entries never wait, so today's app shows no regression.
- [A stale document after a capability flips server-side] → Refreshed on mount and on reconnect;
  within a live tab a flip is picked up at the next reconnect or reload. Truthful until refreshed,
  per ARCHITECTURE.md 6.2.
- [Existing tests see one more gateway call] → Harness doubles answer any path; suites that assert
  call counts are checked and adjusted where the new call is now part of the composed behavior.

## Migration Plan

Client-only; no data, no backend rollout. Order: fixtures + gate rule (RED→GREEN), context
(RED→GREEN), navigation (RED→GREEN), route gate (RED→GREEN), docs. Rollback is reverting the
branch; nothing outside the repository changes.

## Open Questions

None. The vocabulary source was confirmed against Platform's closed enum (`crates/core/src/capability.rs`);
no client-known capability matches a current route family, which is why every shipped surface here
is ungated by declaration rather than by accident.
