# Ratatoskr Web Agent Instructions

## Scope

These instructions apply to the `ratatoskr-web` repository.

This repository owns the browser client. It does not own extraction, analysis, search ranking,
provider synchronization, backup execution, or authorization decisions. It renders what the public
Edge API of `ratatoskr-platform` returns, and it is the only Ratatoskr client whose primary job is
reading and administering the archive rather than capturing into it.

## Repository mission

Give a user a fast, honest, keyboard-usable view of their own archive, and the controls to operate
it, over one network boundary.

Core principles:

- one boundary: the public Edge API, and nothing behind it;
- generated types from `ratatoskr-contracts`, never hand-written request or response shapes;
- capability-driven rendering, never a hard-coded assumption about which services are deployed;
- truthful provenance and truthful failure;
- presentation is not enforcement;
- reading comes before decoration.

## Current phase

The toolchain exists and nothing else does. React 19, TypeScript 6, Vite 8, Tailwind 4, shadcn/ui on
the Base UI base, ESLint, Prettier, Vitest, and a CI gate are in the tree. A router, an API client, a
state cache, a view, and an end-to-end suite are not — do not assume any of them exists until it is
in the checkout. `DEVELOPMENT.md` is the authority on the toolchain and `docs/IMPLEMENTATION_PLAN.md`
on the order the rest arrives in.

What remains true while building the first slices:

- put the fetch gateway, refresh, and error normalization in one place before writing a second view;
- generate API types from the pinned contract in the same commit that first calls the API;
- build the shell, the empty state, the error state, and the loading state together. A view that
  exists only in its happy path is not done;
- a dependency addition is its own commit with its own justification. Everything here ships to a
  browser.

## shadcn/ui

The component base is **Base UI**, recorded in `components.json` as `"style": "base-nova"`. shadcn is
not a component library that gets imported — the CLI copies source into this repository and that
source is then ours to run but not to hand-edit.

### The generated directory

`src/components/ui/` is written by `shadcn add`. Treat it as generated:

- **Never hand-edit a file there to satisfy a linter or a type error.** The next `shadcn add` of that
  component overwrites the edit, the problem returns, and the diff that fixed it is gone.
- To change behavior, compose around the component, or copy it out to `src/components/` under a new
  name and own it from there.
- `eslint.config.js` disables `react-refresh/only-export-components` for that directory alone,
  because shadcn components export a `cva` variants object beside the component. shadcn's own
  generated button fails shadcn's own generated ESLint config on a clean install; this is that, not a
  defect in the tree.

### The base cannot be mixed

shadcn ships three bases — Base UI, Radix, React Aria — and a component is generated against exactly
one of them. This matters more than it sounds for an agent:

- most shadcn material on the internet is written against **Radix**, because it was the only base
  until 2026. A snippet copied from a blog post, an older answer, or memory will import
  `@radix-ui/react-*` and will not work here;
- the import to expect is `@base-ui/react`;
- if a component seems to need a Radix primitive, the answer is the Base UI equivalent, not a second
  base added to `package.json`.

Check the Base UI documentation for the component before writing against it. Do not infer its API
from a Radix example.

### Adding a component

```bash
npm run ui:add -- <name>
```

Let the CLI add it. Do not hand-write a file into `src/components/ui/`, and do not add a
`@base-ui/react` primitive to `package.json` by hand — the CLI resolves the dependency set for the
component and the base together.

### What is frozen

`components.json` records `style`, `tailwind.baseColor` (`neutral`) and `tailwind.cssVariables`
(`true`). The shadcn documentation states that `baseColor` and `cssVariables` **cannot be changed
after initialization** — changing them means deleting and re-installing every component. Do not edit
those fields to make one component look different.

## The two audits

Both are in this repository, both are for you, and they are not interchangeable.

### shadscan — run it, believe it

```bash
npm run audit:ui            # human report
npm run audit:ui:json       # machine-readable
```

Deterministic and in the gate at `--fail-under 68`. Run it after changing anything a user sees, not
only before a commit.

Three rules about it:

- **The threshold is a ratchet.** It is the score the tree already has. Raise it in the same commit
  that raises the score, and name the finding that moved. Never lower it to make a red run go green —
  that converts a regression into a permanently weaker gate, which is the whole failure mode a
  ratchet exists to prevent.
- **Do not implement infrastructure for the score.** shadscan says this itself, and it is right. A
  toast provider mounted with nothing to report, or a command menu with nothing to search, is dead
  code that scores well. `DEVELOPMENT.md` records which findings are waived and why.
- **A finding can be wrong.** `theme-hotkey-present` fails while the shortcut exists and is correctly
  guarded in `src/components/theme-provider.tsx`. Read the evidence before acting on a finding, and
  when it is a false negative, write that down instead of adding a second implementation.

Its `--check-ui <url>` mode renders the page and turns contrast, pointer-target size, and mobile
overflow from advisory into measured. Use it when you have a route to point at.

### improve — read it, do not obey it

`/improve` is a project skill in `.agents/skills/improve/`. It audits and writes plans in `plans/`;
it never edits source. It is deliberately **not** in the gate.

- Use it for the judgement-shaped questions: what is worth doing next, what this branch broke that
  the gate does not check, where the tech debt actually is.
- `/improve branch` before a substantial pull request.
- Its output is a proposal. A plan it wrote is not authority to change this repository's invariants —
  if a plan contradicts `AGENTS.md`, `AGENTS.md` wins and the plan is wrong.
- Do not run `/improve execute` against this repository without saying so. It dispatches another
  model, and one writer per repository per task is a workspace rule, not a preference.

The division is the point: shadscan answers a question with one right answer and blocks the merge;
improve answers a question with several and blocks nothing.

## Styling

- Tailwind CSS 4 with no `tailwind.config.js`. The theme is in `src/index.css` under `@theme inline`,
  and the CSS variables under `:root` and `.dark`. That is the file to edit for a theme change.
- Use the semantic tokens the theme defines — `bg-background`, `text-muted-foreground`,
  `border-border` — not raw palette classes. A raw `bg-neutral-900` is invisible in one of the two
  themes and no test catches it.
- Compose classes with `cn()` from `@/lib/utils`. Concatenating class strings by hand defeats
  `tailwind-merge` and produces a component whose override silently loses.
- The font is self-hosted through `@fontsource-variable/geist`. Do not add a Google Fonts link, a CDN
  stylesheet, or any other third-party host — see the privacy rules below.

## TypeScript version

TypeScript is pinned to `~6.0.3` while 7.0.2 is the latest release, because no published
`typescript-eslint` supports 7 (`peerDependencies.typescript` is `>=4.8.4 <6.1.0`). Taking 7 means
giving up type-aware linting. Do not raise it as a routine dependency bump; raise it in one commit
with `typescript-eslint`, once that package's peer range admits 7.x.

## Sources of truth

Use this order:

1. active task/changeset and accepted ADRs;
2. `README.md`;
3. `ratatoskr-contracts` and the Platform capture, operation, session, and capability contracts;
4. repository tests;
5. implementation details.

An observed API response is not a contract. If the generated types and the running server disagree,
the contract is the defect report, not the thing to work around in the client.

## Hard boundaries

### Web owns

- the route tree, the application shell, and navigation;
- the typed fetch gateway, refresh, retry, and error normalization;
- generated API types and the check that they match the pinned contract;
- client-side state, caching, and invalidation;
- rendering of search results, documents, collections, catalogs, snapshots, and operations;
- forms, validation feedback, and confirmation of destructive actions;
- accessibility, theming, localization readiness, and reading ergonomics;
- the public status page.

### Web does not own

- extraction, parsing, quality scoring, or canonicalization;
- summarization, embeddings, ranking, or relevance;
- provider OAuth exchange, token custody, or provider synchronization;
- backup execution, integrity checking, or restore verification;
- authorization decisions, quotas, or scheduling;
- data retention policy;
- any direct connection to PostgreSQL, NATS, or BlobStore.

## Capability invariant

The client asks Platform which capabilities the deployment has and renders from the answer.

- Never infer a capability from a 404, a 501, a timeout, or an empty collection.
- Never hard-code a service list, a provider list, or a feature flag that duplicates a capability.
- An absent capability renders an explained absence with a path forward, not a disabled control with
  no reason and not a control that fails on click.
- Hiding a control is presentation. The server still enforces. Never treat a hidden control as a
  security boundary, and never add a client-side check as the only thing standing between a user and
  an action.

## Contract and generated types

- The Platform API contract is pinned by digest; the generated types are committed.
- Regeneration is its own commit, and the diff is reviewable.
- A mismatch between the pinned contract and the generated file fails the build. Do not add a flag
  that lets it pass.
- Do not widen a generated type by hand, and do not cast around it. A cast that hides a contract
  disagreement moves a build failure into a user's session.
- A contract change that this client must follow is a workspace changeset, not a local patch.

## Authentication and token handling

- One refresh implementation, in the gateway, with a single in-flight refresh and a queue behind it.
- Storage of the access token follows the approved storage ADR. Do not change it in passing.
- Provider tokens never reach the browser. If a view seems to need one, the design is wrong.
- Sign-out revokes server-side. A cleared local token is not a sign-out.
- Every session and paired device is listable and individually revocable.
- A 401 is a state, not a crash: it resolves to refresh, to re-authentication, or to a truthful
  revoked message.

## Rendering truth

- Render the provenance the API gave. Do not synthesize authority, and do not present an explicit
  capture as a native provider Saved state.
- Keep extraction warnings and partial results visible. A degraded record must not read as clean.
- Report a backup as verified only when restore verification says so.
- Distinguish offline, unauthenticated, revoked, forbidden, unsupported, not-found, invalid,
  partially-succeeded, and terminal failure. Each has a different recovery and a single generic error
  message destroys all of them.
- An empty result and a failed query are different states and never share a component.
- Do not render a stale cache as live without saying it is stale.

## Operations and streaming

- Track operations through the public operation API.
- Prefer a stream; fall back to polling when it drops, and make the fallback visible.
- Never infer completion from elapsed time or from a network idle.
- Handle out-of-order and duplicate events. An operation's state machine is monotonic even when its
  transport is not.
- A long operation survives a page reload, because its state lives on the server.

## Destructive actions

- Name the object and the consequence. "Delete" alone is not a confirmation.
- Require explicit confirmation for deletion, revocation, untracking, and any external provider
  write.
- Every external write carries an idempotency key and a capability check.
- Never place a destructive control where a single stray click reaches it, and never make it the
  default focus of a dialog.

## Privacy in the client

- Private URLs, query strings, note text, selected text, and search queries do not enter telemetry,
  analytics, error reports, or diagnostics exports.
- A diagnostics export redacts tokens, endpoints with credentials, and user content by default.
- Do not add a third-party analytics, font, error-reporting, or tag-manager dependency. This is a
  self-hosted deployment, and a request to a third party from this client is a data leak.
- Log at the boundary, with the shape of the failure, not with its payload.

## Accessibility

Not optional, and not a late pass:

- keyboard reachable and operable, with visible focus and a skip link;
- semantic structure and correct roles before ARIA attributes;
- contrast and type scale verified in both themes;
- no meaning carried by color alone, which matters most for provenance and warning badges;
- reduced-motion honored;
- forms with associated labels and errors announced, not only colored.

## Performance

- The archive is large; assume long lists and long documents.
- Paginate or virtualize; never fetch an unbounded collection to filter it in the browser.
- Cache by contract-derived query keys and invalidate on the operation that changed the data.
- The reader view is the one to keep fast. Measure it before decorating it.

## Testing expectations

- Unit: gateway, refresh, error normalization, query keys, capability gating, formatters.
- Contract: generated types match the pinned digest.
- Component: each view's loading, empty, error, partial, and unauthorized states.
- Accessibility: keyboard traversal and automated checks on the shell, search, and reader.
- End-to-end: sign in, search, open a document, create a collection, run a capture, watch an
  operation to completion, revoke a device.
- Against a local mock or the workspace Compose profile. Never against a live deployment, a real
  provider account, or a real user archive.

## Cross-repository change rules

Use a workspace changeset when changing:

- anything that requires a new or changed Platform endpoint, field, or capability;
- operation phase semantics;
- session, device, or provider-account contracts;
- provenance or authority semantics shared with mobile and the extension;
- deep-link shapes that other clients emit.

State client compatibility, backend rollout order, behavior of an older client against the new
backend, and rollback. The client rolls out last and rolls back first.

## Git and PR workflow

- State which surfaces change: routes, gateway, generated types, a feature area, the shell, or
  tooling.
- Keep a regeneration commit separate from a behavior commit.
- Keep a dependency addition separate from a feature, and justify it. A dependency in this client
  ships to a browser.
- Include the states you added, not only the happy path.
- Do not commit tokens, private URLs, real archive fixtures, screenshots containing user content, or
  a production endpoint that is not intentionally public configuration.
- Update `README.md` when a boundary, invariant, or capability rule changes.

## Completion criteria

A task is complete only when:

- the client talks to the Edge API and nothing else;
- generated types match the pinned contract and the build proves it;
- capability gating is server-driven and no control fails on click;
- loading, empty, error, partial, unauthorized, and offline states exist for what was added;
- provenance, warnings, and backup verification are rendered truthfully;
- destructive and external-write actions are confirmed, idempotent, and capability-checked;
- no user content reaches telemetry or diagnostics;
- keyboard traversal and contrast hold in both themes;
- typecheck, lint, unit, component, and the relevant end-to-end tests pass;
- no placeholder, skipped test, or unimplemented branch remains in the diff.
