# Ratatoskr Web

`ratatoskr-web` is the browser client for Ratatoskr. It is the surface on which a user reads,
searches, organizes, and operates their own archive: articles, GitHub repositories, X, Instagram and
Threads sources, ChatGPT and Claude exports, Git Vault snapshots, and the operations that produced
them.

> **Status:** the toolchain is in place and nothing else is. React 19, TypeScript 6, Vite 8,
> Tailwind 4, shadcn/ui on the Base UI base, ESLint, Prettier, Vitest and a CI gate are in the
> tree. No router, API client, state cache, view, or end-to-end suite exists yet.

> [!IMPORTANT]
> **Ratatoskr is in development.** No database holds data that has to survive a schema change.
> While this status holds, these two rules replace what the documents below plan:
>
> - the API and the database keep their first version. There is no `v2` and no later major
>   version.
> - the database has no migrations. One schema definition exists, and a schema change edits it in
>   place.
>
> Only the repository owner changes this status.

This repository reuses the `ratatoskr-web` name from the retired client of the first Ratatoskr
generation. It shares no history and no code with it. The retired client is a local read-only
archive in `ratatoskr-workspace` and has no Git remote.

## Role in Ratatoskr

Mobile and the browser extension are capture surfaces first. Web is the opposite: it is the surface
where the archive is read and administered. It answers questions the capture clients deliberately do
not:

> What is in the archive, what happened to it, and is the backup of it real?

Web is a client of one boundary only — the public Edge API of `ratatoskr-platform`. It holds no
domain logic that a service already owns, and it reaches no service, database, object store, or
message bus directly.

```text
ratatoskr-web  ->  ratatoskr-platform (Edge API)  ->  every other service
```

`ratatoskr-contracts` is the second dependency, and it is a build-time one: the API types this
client compiles against are generated from the contract, never hand-written from an observed
response.

## Core responsibilities

- unified search across articles, repositories, social sources, and AI archives;
- reader and detail views with provenance, warnings, and extraction quality visible;
- collections, tags, and manual curation;
- capture by URL, and capture review for what the other clients queued;
- GitHub catalog: tracked repositories, stars, lists, watches, and desired backup state;
- Git Vault: snapshots, integrity results, and restore verification evidence;
- operation monitoring — accepted, running, completed with warnings, failed;
- account, session, and paired-device management;
- connected provider accounts, their scopes, and their revocation;
- operational views for one self-hosted deployment: schedules, queues, storage, and service health.

## Non-goals

- Extraction, analysis, embedding, or ranking. Those belong to `ratatoskr-extractor` and
  `ratatoskr-knowledge`, and the client renders their results rather than reproducing them.
- Provider synchronization. The connectors own it.
- Direct NATS, PostgreSQL, or BlobStore access.
- A second authorization model. Platform decides; the client renders capability, and never grants
  itself a view by hiding a button.
- Multi-tenant administration. The deployment target is one machine and one household.
- A public content site. Every view except the status page is behind authentication.

## Proposed repository structure

```text
ratatoskr-web/
├── src/
│   ├── app/          # entrypoint, providers, router, error boundaries
│   ├── api/          # generated contract types, fetch gateway, streaming, query keys
│   ├── auth/         # session boot, refresh, device and provider account state
│   ├── features/     # search, reader, collections, github, vault, operations, settings, ops
│   ├── components/   # shell, navigation, shared composition
│   └── lib/          # runtime configuration, query client, storage, errors
├── e2e/
├── docs/
└── tooling/
```

Of that tree, `src/components/` (shadcn's generated `ui/` and one composed view), `src/lib/` and
`src/test/` exist. The rest arrives with the slices that need it.

[`DESIGN.md`](DESIGN.md) is the authority on the visual identity — palette, type scale, shape,
surfaces — and its values are tokens in `src/index.css`.

The framework, build tool, component base, and icon policy are decided and recorded:
[ADR-0001](docs/adr/0001-framework-and-build.md),
[ADR-0002](docs/adr/0002-shadcn-base-ui.md) and
[ADR-0003](docs/adr/0003-icons.md). `DEVELOPMENT.md` carries the version table and the command
list.

## Contract-generated API client

The client does not hand-write request or response types. The Platform API contract is pinned by
digest, the types are generated from it, and a drift between the pinned contract and the generated
file is a build failure rather than a runtime surprise.

```text
ratatoskr-contracts  ->  pinned digest  ->  generated types  ->  typed fetch gateway
```

This is what makes `ws drift` meaningful for a client: a contract change that this repository has not
regenerated against is visible in the workspace before it is visible to a user.

## Capability-driven rendering

A self-hosted deployment does not run every service. A user may have no X account connected, no
GitHub token, and no Git Vault storage attached. The client asks Platform what is available and
renders accordingly: for an authenticated session it reads the capability document from
`GET /v1/capabilities`, navigation renders from a feature registry filtered through one typed
gating rule, and routes sit behind the same rule — so a deep link into something this deployment
cannot honour meets an explained absence rather than a broken view.

Rules:

- an absent capability produces an explained absence, not a dead control;
- a present capability that the user has not configured produces a path to configure it;
- the client never infers a capability from a 404, a timeout, or an empty list;
- a failed capability read renders its own retryable state and decides nothing about what exists;
- hiding a control is a presentation decision and is never the enforcement of a permission.

## Operation progress

Capture and backup are asynchronous. Web tracks them through the public operation API and streams
updates rather than polling a detail endpoint in a loop.

```text
Accepted
Resolving source
Extracting content
Analysing
Stored
Completed with warnings
Failed — retry available
```

A stream that drops falls back to polling and says so. The client never infers completion from
elapsed time, and it never reports success it has not been told about.

## Authentication and session

- boot probes the session through an authenticated read before any route renders; the decision is
  authenticated, unauthenticated, or backend-unreachable, each with its own designed surface;
- the presented credential is held in `sessionStorage` per
  [ADR-0006](docs/adr/0006-credential-custody.md) and discarded on sign-out or refusal;
- refresh is answered by one provider implementation behind the gateway's single-flight
  coordinator; in this contract version it truthfully reports that no mechanism exists;
- sign-out always confirms first, runs through the provider's revoke operation once, and claims
  only what the client performs — server-side revocation arrives with a Platform endpoint for it;
- provider tokens are never delivered to the browser at all;
- every session and paired device will be listed and individually revocable from settings (item
  11).

## Truthfulness invariants

1. The client renders provenance it was given and never invents authority for a record.
2. An explicit capture is never presented as a native provider Saved state.
3. Extraction warnings and partial results stay visible; a degraded record is not shown as clean.
4. A backup is reported verified only when the restore verification says so.
5. An error distinguishes offline, unauthenticated, revoked, unsupported, and failed, because the
   recovery differs for each.
6. A destructive action names what it deletes and cannot be reached by a single unconfirmed click.
7. Private URLs, note text, and search queries do not enter telemetry or diagnostics.
8. A capability the deployment lacks is explained, not silently removed.

## Accessibility and the reading surface

This client is read first and clicked second. Long-form reading, keyboard-only search, and legible
density are requirements rather than polish:

- every interactive control reachable and operable by keyboard;
- visible focus, and a skip path into the main region;
- contrast and type scale that survive a long article in both themes;
- no meaning carried by color alone, which matters for provenance and warning badges;
- motion honors the reduced-motion preference.

## Initial milestones

1. ~~Scaffold the project, lint, typecheck, test, build, and `ci.yml`.~~ Done.
2. ~~Generate the API client from the pinned contract and fail the build on drift.~~ Done.
3. ~~Implement session boot, refresh, protected shell, and sign-out.~~ Done: boot gate, protected
   shell with lazy routes, presented-credential sign-in, sign-out, unauthorized surface. The
   credentials-mint, refresh, and revocation endpoints this needs from Platform are recorded as a
   workspace-changeset prerequisite.
4. Implement search and the article reader against a local Platform.
5. Add collections and tags.
6. Add operation tracking with streaming and a polling fallback.
7. Add the GitHub catalog and Git Vault views, including restore verification evidence.
8. Add social and AI-archive browsing with truthful provenance.
9. Add settings: devices, sessions, provider accounts, and revocation.
10. Add operational views, the public status page, and workspace end-to-end tests.

## Workspace integration

The planned workspace harness will pin this repository together with compatible
`ratatoskr-platform` and `ratatoskr-contracts` commits. Its intended mount is
`repos/clients/web/`, under the workspace key `web` with the role `client`. The harness, repository
pin and mount do not exist yet. In a future cross-repository changeset the client is last in the
rollout order and first in the rollback order, because a client may depend on a deployed contract
but nothing deployed depends on the client.

End-to-end tests against an isolated workspace Compose profile are also planned; no such profile or
end-to-end suite exists today. They will not target a live deployment.

## Project status

This README defines the intended browser client. What exists is the toolchain and one generated
shadcn component; the API client, the routes, and every view described above do not. See
`DEVELOPMENT.md` for the toolchain and `docs/IMPLEMENTATION_PLAN.md` for the order the rest
arrives in.
