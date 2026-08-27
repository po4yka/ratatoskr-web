## Why

Ratatoskr Web has no surface for the GitHub catalog or the Git Vault evidence
that a user needs to decide whether a repository is protected. This first
version makes the catalog, consent boundary, mirror state, snapshot manifest,
and restore-drill result readable without claiming that fixture data is live.

## What Changes

- Add capability-gated GitHub catalog and Git Vault routes, plus their lazy
  navigation entries and truthful loading, empty, partial, failure, offline,
  and unavailable states.
- Add a GitHub connection surface with PAT validation/submission and a PKCE
  redirect only when the Platform facade advertises an OAuth start URL.
- Add repository catalog/detail projections for provider-supplied metadata,
  star/tracked/ignored state, and optional analysis data.
- Add explicit, named confirmation dialogs before fixture-backed track and
  star writes; do not issue a write until consent is confirmed.
- Add Git Vault mirror-health and per-mirror snapshot views that display
  supplied manifest digests, plus restore-drill evidence exactly as supplied,
  including result, timestamps, and timings.
- Use contract-fixed fixtures because the pinned Edge contract exposes neither
  GitHub/Git Vault routes nor their capability names; mark live integration
  pending rather than inventing request or response types.
- Record star-list management depth and watch configuration as follow-ups.

## Capabilities

### New Capabilities

- `github-vault-catalog`: capability-gated GitHub catalog, consented catalog
  writes, Git Vault mirror/snapshot rendering, and truthful restore-drill
  evidence.

### Modified Capabilities

- None.

## Impact

- Affects the feature registry, lazy router, capability vocabulary, fixture
  source, GitHub and vault feature modules, shared confirmation composition,
  component tests, and implementation-plan status.
- Adds no dependency and does not change the pinned API artifact, because the
  Edge contract currently has no GitHub/Git Vault endpoint or capability to
  consume.
- Live integration remains pending on a workspace contract change that defines
  the Edge API, capability names, OAuth facade semantics, write idempotency,
  and Git Vault projections. The client will continue to use only the public
  Edge API when that contract exists.
