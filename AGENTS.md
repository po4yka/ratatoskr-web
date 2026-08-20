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

### Development status

Ratatoskr is in development. No database holds data that has to survive a schema change. While this
status holds, these rules are binding, and they override anything else in this repository that
plans otherwise, including the rest of this file:

- **One version only.** The API, the database, and the contracts keep their first version. Do not
  add a `v2` or a later major version, and do not add version negotiation, deprecation windows, or
  parallel-major routing.
- **No database migrations.** Do not add a migration file, and do not add migration tooling. A
  schema change edits the current schema definition in place, and a test database is created from
  that definition.
- **The product is `Ratatoskr`.** It is not "Ratatoskr Next". Do not write that name in code,
  documentation, identifiers, comments, or commit messages.

Only the repository owner changes this status. Ask before you write anything these rules forbid.

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

## Icons

Two sets, one rule.

**`lucide-react` is the default.** Every generated shadcn component imports it, it is static, and it
costs nothing beyond the icons actually used. Reach for it first, and for almost everything.

**[itshover](https://github.com/itshover/itshover) is the exception**, for the places where motion
carries something: feedback on an action, a state that changed, an affordance worth pointing at.
Never for decoration on a page that is only being read. See ADR-0003.

```bash
npm run ui:add -- @itshover/<name>-icon     # e.g. @itshover/refresh-icon
```

The registry is already in `components.json`. The CLI writes the icon and `types.ts` into
`src/components/ui/`, which is generated — the same rules apply as for any shadcn component.

### Always render them through the wrapper

```tsx
import { AnimatedIcon } from "@/components/animated-icon"
import RefreshIcon from "@/components/ui/refresh-icon"

<AnimatedIcon icon={RefreshIcon} size={16} data-icon="inline-start" />   // decorative
<AnimatedIcon icon={RefreshIcon} label="Refresh" />                      // carries meaning
```

Never import an itshover icon straight into a view. The generated component destructures `size`,
`color`, `strokeWidth` and `className` and **drops every other prop**, so `aria-hidden`, `aria-label`,
`role` and `data-*` cannot reach the `svg` at all. `AnimatedIcon` is the element that carries them.

Rules that follow:

- **Decorative by default.** No `label` means `aria-hidden`. Pass `label` only when the icon is the
  only thing conveying its meaning — an icon beside the word "Retry" is decorative, and a name there
  is read twice.
- **`data-icon="inline-start"` on an icon inside a `Button`.** The shadcn Button takes its inline
  spacing from that attribute. shadscan checks it.
- **The motion is never the only feedback.** These icons animate on hover, so a keyboard user never
  sees the animation. That is fine while it means nothing, and a defect the moment it means
  something.
- **Do not add a reduced-motion check at a call site.** It is handled in two places already and a
  third would rot: `MotionConfig reducedMotion="user"` in `main.tsx` for declarative motion, and a
  CSS block in `index.css` scoped to `[data-animated-icon]` for the imperative `animate()` the
  generated icons use. `MotionConfig` does not cover that second path — measured, and the measurement
  is a test.

### Do not

- mix an itshover icon and a lucide icon in the same row or control group — the stroke and grid
  differ and it reads as a mistake;
- reach for an animated icon because a static one is available in itshover too. lucide is smaller and
  already there;
- add a second animation library. `motion` is here for these icons and is the largest dependency this
  client carries after React.

## Design libraries

Four are connected, on three different footings. ADR-0004 has the reasoning; this is the operating
rule.

| Library | How to reach it | Wrapper |
|---|---|---|
| `thinking-orbs` | `import { ThinkingOrb } from "thinking-orbs"` | none needed |
| `liquid-gooey` | `import { Liquid } from "liquid-gooey"`, then `Liquid.Item` | none needed |
| Canvas UI | `npm run ui:add -- @canvas-ui/<name>-react` | none needed |
| AIcss | `npm run ui:add:aicss -- <slug>` | **always** `AicssBlock` |

`src/components/canvasui/` and `src/components/aicss/` are generated, exactly like
`src/components/ui/`. Never hand-edit them; to own a component, copy it out into `src/components/`
under a new name.

### The licence condition you must not quietly break

Canvas UI is MIT + **Commons Clause**. The clause withdraws one right: to **Sell** — to charge for
the software, or for a product or service whose value derives substantially from it. It is vendored
here on the basis that Ratatoskr is not sold and is not offered as a paid or hosted service.

That is a fact about today, not a property of the code. **If this project is ever sold, offered as a
paid or hosted service, or bundled into something that is, `src/components/canvasui/` must be removed
first.** If a task moves in that direction, stop and say so rather than deciding it in passing.

AIcss states no licence at all. What is vendored from it is kept small and in one directory on
purpose. Do not grow it without asking.

### AIcss components always go through `AicssBlock`

```tsx
import { AicssBlock } from "@/components/aicss-block"
import { ThinkingState } from "@/components/aicss/ThinkingState"

<AicssBlock status>
  <ThinkingState />
</AicssBlock>
```

They arrive without two things this repository requires, and neither is fixable in place:

- **no reduced-motion handling** — the CSS runs `animation: … infinite` with no media query.
  `AicssBlock` sets `data-vendored-motion`, which the backstop in `src/index.css` targets;
- **no live-region semantics** — a status that never announces is not a status. `status` adds
  `role="status"`. Mount the region before the message changes: a live region announces a change, not
  its initial content. Leave `status` off for a table or a code block, which are read on demand.

The third gap is yours to handle when you adopt one: these components hard-code hex colours and
`ThinkingState`'s dark-mode block is a copy of its light one, so it has no dark mode despite
appearing to. Copy the component out of `src/components/aicss/` and rewrite its module CSS against
the theme tokens.

### Rules for the two npm packages

- Nothing imports them yet, deliberately. `src/test/design-libraries.test.tsx` mounts both so the
  dependency cannot rot unnoticed; if you remove the last usage, keep that test.
- `liquid-gooey` is `0.1.0`. Its API is not settled, and it declares the `LiquidItem` type without
  exporting the component — use `Liquid.Item`.
- `liquid-gooey`'s value is that the filter runs on a silhouette layer and the content stays real
  DOM. Never put content into the filtered layer; the test asserts that boundary.
- `thinking-orbs` reads the theme from the `.dark` class already on the tree. Do not add a theme prop
  to make it match.

### Where they may be used

This client reads an archive. It is not a chat surface, and three of these four were designed for
one.

- `thinking-orbs` — the `Analysing` phase of a long operation. Not page furniture.
- `liquid-gooey` — one tab indicator or one merging menu. Not a house style.
- AIcss — `streaming-text`, `task-list`, `code-block` if summary output ever streams. Its `orbs` and
  `thinking-state` overlap `thinking-orbs`; pick one.
- Canvas UI — decoration on `/status` or login at most. **Never under content**: anything drawn into
  a canvas is not in the DOM, so it cannot be selected, found by in-page search, or read by a screen
  reader. For a reading client that is disqualifying, not a trade-off.

None of them may carry information that is unavailable without them, and none may be the only
feedback for an interaction — the same rule the itshover icons answer to.

## Project skills

Ten skills are installed as project skills, pinned in `skills-lock.json` and linked into
`.claude/skills/`. Restore them with `npx skills experimental_install`. All are MIT.

They are here because this client is read first and clicked second, and the difference between a
reading surface that feels right and one that does not is made of decisions too small to argue about
one at a time.

### Design and motion — [emilkowalski/skills](https://github.com/emilkowalski/skills)

| Skill | Use it for |
|---|---|
| `emil-design-eng` | The philosophy the rest derive from. Component design, polish, the invisible details |
| `apple-design` | Interruptibility, springs, materials, **reduced motion (§14) and typography (§15)** |
| `animate` | Building one animation, in the order the decisions actually matter |
| `review-animations` | Checking motion against ten non-negotiable standards. Approval is earned |
| `find-animation-opportunities` | Surveying what could animate — and, required, what should not |
| `animation-vocabulary` | Naming an effect someone described but could not name |

### Engineering — [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)

| Skill | Use it for |
|---|---|
| `frontend-ui-engineering` | Component architecture, WCAG 2.1 AA, loading and transition states, and its Red Flags list |
| `performance-optimization` | Core Web Vitals, a performance budget, and finding out what is actually slow before changing it |

`performance-optimization` has a specific job here that is already waiting for it:
`docs/ARCHITECTURE.md` section 15 makes reader performance a requirement, `motion` costs about 43 kB
gzipped, and route splitting is an open follow-up in ADR-0003. Measure before and after, not instead
of.

### Prose — [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop)

`stop-slop` removes the tells that make agent-written prose read as agent-written. Nearly every word
in this repository is documentation, and documentation nobody wants to read is documentation nobody
reads. It complements the ASD-STE100 rule rather than replacing it.

Two of them earn their place beyond motion. `apple-design` §15 is about optical sizing, tracking and
leading — the reader view is the surface where that shows, and it is the one this client exists for.
§14 is reduced motion, which this repository already enforces in two places and now has a standard to
enforce it against.

### How they interact with the rules already here

They do not override anything. If a skill proposes motion that breaks a rule in this file, the rule
wins:

- motion is never the only feedback for an interaction;
- an animation never carries information unavailable without it;
- reduced motion is honoured — `MotionConfig` for declarative motion, the CSS backstop for vendored;
- keyboard operability, visible focus and contrast are not tradeable against feel.

`review-animations` and `find-animation-opportunities` do not run on their own; invoke them
deliberately. Author and review stay separate passes: do not run `review-animations` over motion you
wrote in the same turn and call it approved.

### What was deliberately not installed

Five of `emilkowalski/skills`' eleven were left out, and the reasons are worth keeping so they are
not re-litigated:

- **`animate-expo`** — React Native and Expo. That is `ratatoskr-mobile`'s repository, not this one.
- **`pick-ui-library`** — the choice is made and recorded in ADR-0002, ADR-0003 and ADR-0004. A skill
  whose job is to pick a UI library is a skill for re-opening a settled decision.
- **`improve-animations`** — the same shape as `improve`, which is already installed: survey, then
  write plans for other agents. One planner is enough; use `improve` and say the audit is about
  motion.
- **`ask-sonner`** — toasts are deliberately waived until there is a user action worth reporting.
  Install it in the commit that adds Sonner, not before.
- **`prototype`** — builds several versions of a component behind a picker. Useful, and it writes
  throwaway code into the tree. Ask before adding it.

Three more were considered from elsewhere and rejected:

- **`Jpisnice/shadcn-ui-mcp-server`** — an MCP that gives an agent shadcn component context, which
  sounds like the exact fix for the failure mode this file warns about hardest. It could equally be
  the cause: Base UI became shadcn's default only in July 2026, and nothing in that project states
  which base its data describes. A context server that confidently returns Radix APIs would make the
  Radix-versus-Base-UI mistake *more* likely, not less. Verify what base it serves before installing
  it.
- **`mattpocock/skills`** — 35 good skills, most of which are already available in the environment
  (`codebase-design`, `domain-modeling`, `tdd`, `research`, `prototype`, `diagnosing-bugs`). A
  project-scoped copy of a skill the agent already has is a second version to keep in step.
- **`pbakaus/impeccable`** — a design language for AI harnesses, and a good one. Two design languages
  are worse than one, and `emil-design-eng` plus `apple-design` are already installed and already
  agree with each other.

## The two audits

Both are in this repository, both are for you, and they are not interchangeable.

### shadscan — run it, believe it

```bash
npm run audit:ui            # human report
npm run audit:ui:json       # machine-readable
```

Deterministic and in the gate at `--fail-under 69`. Run it after changing anything a user sees, not
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

**`DESIGN.md` is the authority on what this client looks like.** Read it before writing a component.
It carries the palette, the type scale, the two radii, the surface stack, and a Deviations section
recording every place it disagrees with the reference it came from and why.

Where `DESIGN.md` and this file disagree, **this file wins** — that rule is what produced three of
the deviations, including the focus ring.


- Tailwind CSS 4 with no `tailwind.config.js`. The theme is in `src/index.css` under `@theme inline`,
  and the CSS variables under `:root` and `.dark`. That is the file to edit for a theme change.
- Use the semantic tokens the theme defines — `bg-background`, `text-muted-foreground`,
  `border-border` — not raw palette classes. A raw `bg-neutral-900` is invisible in one of the two
  themes and no test catches it. The tokens carry `DESIGN.md`'s values under shadcn's names, so a
  component installed by `shadcn add` inherits the identity without being told about it.
- Use the type scale: `text-caption`, `text-body`, `text-body-lg`, `text-subheading`,
  `text-heading-sm`, `text-heading`, `text-heading-lg`, `text-display`. Each carries its own line
  height and tracking. Do not hand-set `text-sm` with a `leading-*` beside it.
- Two radii and nothing between them: `rounded-lg` (18px) on anything interactive, `rounded-xl`
  (24px) on containers. No square corners.
- The reader view is the one place the density scale is broken on purpose: `text-body-lg` minimum,
  measure capped near 70 characters. Everywhere else, `text-body`.
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
