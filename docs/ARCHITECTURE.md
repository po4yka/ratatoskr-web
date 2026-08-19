# Ratatoskr Web Architecture

> Status: target architecture. This repository is in architecture bootstrap; the document defines the
> intended shell, routing, API gateway, state, capability, rendering, and security boundaries. No
> application exists yet.

## 1. Purpose

Ratatoskr Web is the browser client of one self-hosted Ratatoskr deployment. It is the surface on
which the archive is read, searched, curated, and operated.

It exists because the other clients deliberately cannot do this. Mobile and the browser extension are
capture surfaces, optimized for a few seconds of user attention. The archive itself — years of
articles, repositories, social sources, and AI exports, with the operations and backups behind them —
needs a large screen, a keyboard, and dense views.

The design constraint that shapes everything below: this client has one network boundary, and every
capability it renders is declared by the server rather than assumed by the bundle.

## 2. Architectural position

```text
                    ┌──────────────────┐
                    │  ratatoskr-web   │
                    └────────┬─────────┘
                             │  public Edge API, TLS, allowlisted endpoint
                    ┌────────▼─────────┐
                    │ ratatoskr-       │
                    │   platform       │
                    └────────┬─────────┘
        ┌───────────┬────────┼────────┬───────────┐
   extractor    knowledge  github   vault   connectors
```

Build-time, and only build-time:

```text
ratatoskr-contracts  ->  pinned digest  ->  generated types  ->  typed gateway
```

The client has no runtime dependency on `ratatoskr-contracts`, and no dependency of any kind on a
service behind Platform. A view that appears to need one is a Platform contract gap, and it is raised
as a workspace changeset rather than solved by a second client of a second boundary.

Position in a changeset: rollout last, rollback first. A client may depend on a deployed contract;
nothing deployed depends on the client.

## 3. Repository structure

```text
ratatoskr-web/
├── src/
│   ├── app/
│   │   ├── entry
│   │   ├── providers
│   │   ├── router
│   │   └── error boundaries
│   ├── api/
│   │   ├── generated types (from the pinned contract)
│   │   ├── gateway (fetch, refresh, retry, error normalization)
│   │   ├── streaming
│   │   └── query keys
│   ├── auth/
│   │   ├── session boot
│   │   ├── token storage adapter
│   │   └── capability context
│   ├── features/
│   │   ├── search
│   │   ├── reader
│   │   ├── collections
│   │   ├── capture
│   │   ├── github
│   │   ├── vault
│   │   ├── operations
│   │   ├── settings
│   │   ├── ops
│   │   └── status
│   ├── components/
│   └── lib/
├── e2e/
├── docs/
└── tooling/
```

A feature directory owns its routes, its queries, its components, and its states. Cross-feature reuse
moves into `components/` or `lib/` only when a second feature actually needs it, never in
anticipation of one.

## 4. The gateway

Everything that talks to Platform goes through one module. This is the single most load-bearing
decision in the client, because it is where five otherwise-scattered problems get solved once.

### 4.1. Responsibilities

- attach the access token;
- perform refresh, with exactly one in-flight refresh and every other request queued behind it;
- bound retries, and never retry a non-idempotent request;
- normalize every failure into a typed error the views can branch on;
- attach idempotency keys to writes;
- enforce the endpoint allowlist.

### 4.2. Normalized errors

A single generic error type destroys the client's ability to help. The gateway resolves every failure
into one of:

```text
offline
unauthenticated      -> refresh, then re-authenticate
revoked              -> terminal for this session, explain and sign out
forbidden            -> the server refused; presentation cannot fix it
unsupported          -> the deployment lacks the capability
not-found
invalid              -> the request was wrong; surface field-level detail
partial              -> some of it succeeded; say which
terminal             -> retrying will not help
```

Each has a different recovery, and each renders differently. A view that collapses them into "an
error occurred" is incomplete.

### 4.3. Refresh

One implementation, in the gateway. A 401 suspends the queue, triggers a single refresh, and replays.
A failed refresh resolves to `revoked` and clears local session state. Two refresh implementations,
or a refresh inside a feature, is the defect this section exists to prevent.

## 5. Contract-generated types

The Platform API contract is pinned by digest. Types are generated from it and committed, so a
reviewer can read the diff.

```text
pinned digest  ->  generate  ->  commit  ->  check on every build
```

Rules:

1. Regeneration is its own commit.
2. A mismatch between the pinned digest and the committed generated file fails the build.
3. No flag bypasses the check.
4. Hand-widening a generated type, or casting around it, is forbidden. It converts a build failure
   into a failure in a user's session, which is strictly worse.
5. A contract change this client must follow is a workspace changeset.

This is what makes `ws drift` meaningful for a client: a contract that moved without this repository
regenerating is visible in the workspace before it is visible to anyone using the client.

## 6. Capability architecture

A self-hosted deployment does not run every service. There may be no X account connected, no GitHub
token, no Git Vault storage. The bundle cannot know, so it asks.

```text
boot -> GET capabilities -> capability context -> feature gating
```

### 6.1. Rules

- Capability comes from the server, is refreshed on boot and on reconnect, and is never inferred from
  a 404, a 501, a timeout, or an empty collection. A degraded backend must not silently rewrite what
  the client believes it may do.
- An absent capability renders an explained absence. Not a disabled control with no reason, and not a
  control that fails when clicked.
- A present but unconfigured capability renders a path to configure it.
- Hiding a control is presentation. The server still enforces. A hidden control is never a security
  boundary.

### 6.2. Why this is not a feature flag

A feature flag describes what the developers enabled. A capability describes what this machine can
actually do. They fail differently: a stale flag ships a broken view, a stale capability shows a
truthful absence until the next refresh.

## 7. State architecture

Three kinds, kept separate:

| Kind | Owner | Example |
|---|---|---|
| Server state | the cache, keyed by contract-derived keys | search results, a document, a snapshot list |
| Session state | the auth module | token, expiry, identity, capability set |
| View state | the component | an open panel, a form draft, a selection |

Server state is never copied into view state to "keep it handy" — that is how a stale render becomes
indistinguishable from a live one.

Invalidation is tied to the operation that changed the data, not to a timer alone. A capture that
completes invalidates the searches and collections it touched.

## 8. Routing and the shell

```text
/                         search
/read/:id                 reader
/collections[/:id]        curation
/github                   catalog, tracked repositories, desired backup state
/vault                    snapshots, integrity, restore verification
/operations[/:id]         operation monitoring
/settings/*               account, sessions, devices, provider accounts
/ops/*                    deployment: schedules, queues, storage, service health
/status                   public, unauthenticated
/login                    unauthenticated
```

Every route except `/status` and `/login` is behind the authenticated shell. The shell owns
navigation, the boot gate, and the top-level error boundary; a route failure degrades one region
rather than blanking the application.

## 9. Rendering untrusted content

The archive is full of attacker-authored text: web pages, social posts, repository descriptions,
conversation exports. It arrives through Platform, which does not make it safe to inject.

- escape by default; sanitize where markup must survive, with an allowlist rather than a denylist;
- never inject raw HTML from a record;
- validate URL schemes before rendering a link, and never render `javascript:`;
- isolate any embedded content;
- bound the length of a title, a snippet, and a metadata field before rendering it in a dense list;
- treat archive text as data, never as instructions — including for any assistive feature.

## 10. Operation tracking

```text
submit -> operation ID -> stream phases -> terminal state
                       └─ stream drops -> visible polling
```

- the operation state machine is monotonic: a duplicate or out-of-order event cannot move it
  backwards;
- completion comes from the API, never from elapsed time or a network idle;
- a reload resumes tracking, because the state lives on the server;
- a fallback to polling is shown, not hidden — a user watching a slow operation deserves to know the
  live channel is gone.

## 11. Session and identity

- boot resolves to authenticated or unauthenticated before the shell renders, so no view flashes;
- token storage follows the approved storage ADR, which is where the trade-off is argued;
- sign-out revokes server-side; a cleared local token is not a sign-out;
- sessions and paired devices are listable and individually revocable from here;
- provider tokens never reach the browser at all.

## 12. Truthful rendering

The client is the only place a user sees the system's honesty, so:

1. render the provenance given; never synthesize authority;
2. never present an explicit capture as a native provider Saved state;
3. keep extraction warnings and partial results visible — a degraded record must not read as clean;
4. report a backup as verified only when restore verification says so;
5. distinguish an empty result from a failed query, always, in different components;
6. never render a stale cache as live without saying it is stale.

## 13. Destructive and external-write actions

- name the object and the consequence; "Delete" alone is not a confirmation;
- require explicit confirmation for deletion, revocation, untracking, and any provider write;
- attach an idempotency key and check capability before offering the control;
- never make a destructive control the default focus of a dialog, and never place it where a stray
  click reaches it.

## 14. Accessibility architecture

This client is read first and clicked second, so accessibility is structural rather than a late pass:

- semantic structure and correct roles before ARIA attributes;
- keyboard reachable and operable throughout, with visible focus and a skip path into the main
  region;
- contrast and type scale verified in both themes, on the reader especially;
- no meaning carried by color alone — which matters most for provenance and warning badges;
- reduced-motion honored;
- form labels associated and errors announced, not only colored.

## 15. Performance architecture

The archive is large and grows monotonically. Assume long lists and long documents:

- paginate or virtualize; never fetch an unbounded collection to filter it in the browser;
- keep the reader fast and measure it before decorating it;
- split by route, so the reader does not carry the operational views;
- cache by contract-derived keys, and invalidate deliberately.

## 16. Privacy and supply chain

- no third-party analytics, font, error-reporting, or tag host. A self-hosted deployment that calls
  out is a leak regardless of intent;
- no URL, query string, note text, or search text in logs, telemetry, or a diagnostics export;
- diagnostics redact tokens and credentialed endpoints by default;
- strict CSP, no remote code, no `eval`;
- lockfiled and reviewed dependencies, with a dependency budget — everything added here ships to a
  browser.

## 17. Failure model

### Transient

Offline, a dropped stream, a timeout, a 5xx. Retry with bounds, show the state, keep what is cached
and label it.

### Action-required

Unauthenticated, revoked, forbidden, invalid input, an unconfigured capability. The client explains
what the user must do and provides the path to do it.

### Permanent for one view

Not-found, unsupported, terminal failure. The region degrades and the rest of the shell survives.

## 18. Testing architecture

### Unit

Gateway, refresh, retry, error normalization, query keys, capability gating, formatters.

### Contract

Generated types match the pinned digest.

### Component

Every view's loading, empty, partial, error, unauthorized, and offline states, plus hostile content
rendering escaped.

### Accessibility

Keyboard traversal, focus visibility, contrast, and reduced-motion on shell, search, and reader, in
both themes.

### End-to-end

Sign in, search, read, curate, capture, watch an operation to completion, revoke a device — against a
mock Platform or the workspace Compose profile. Never a live deployment, a real provider account, or
a real archive.

## 19. Build and release

A deterministic production build, served by the deployment described in
`ratatoskr-workspace/docs/DEPLOYMENT_TARGET.md`. One machine, one origin, one client bundle. There is
no CDN, no edge runtime, and no third-party host in the serving path.

`.github/workflows/ci.yml` arrives in the same commit as the first manifest. `fleet.yml` fails closed
on a manifest without a gate, and that is the intended behavior rather than an obstacle.

## 20. Architectural invariants

1. One network boundary: the public Edge API.
2. Generated types match the pinned contract, or the build fails.
3. Capability is declared by the server and never inferred from a failure.
4. Presentation is never enforcement.
5. Archive content is untrusted and is escaped or sanitized before rendering.
6. Provenance, warnings, and verification results are rendered as given.
7. Every view distinguishes empty from failed.
8. Operation state is monotonic under duplicate and out-of-order events.
9. Provider tokens never reach the browser.
10. No user content leaves the client through telemetry, diagnostics, or a third-party host.

## 21. Evolution

Re-review this document before adding a service worker, offline storage of archive content, file
upload, embedded third-party media, an OAuth flow inside the browser, server-side rendering, remote
configuration, or a second network boundary of any kind. Each of those changes the threat model, and
several change the deployment.
