# ADR-0004: four design libraries, connected on different terms

> Status: Accepted  
> Date: 2026-08-19

## Context

Four element libraries were nominated for the design work ahead: [AIcss](https://www.aicss.dev/),
[Canvas UI](https://canvasui.dev/), [liquid-gooey](https://github.com/Jakubantalik/Libraries) and
[thinking-orbs](https://github.com/Jakubantalik/Libraries). Nothing uses them yet; the ask is that
they be available when the design starts.

They are four different kinds of thing, and connecting them the same way would be wrong. Two are npm
packages, one is a shadcn registry, and one is a bespoke JSON API. Two are MIT, one is MIT with a
clause that changes what a public repository may do, and one states no licence at all.

## Decision

| Library | How it is connected | Licence |
|---|---|---|
| `thinking-orbs` 0.3.1 | npm dependency, installed | MIT |
| `liquid-gooey` 0.1.0 | npm dependency, installed | MIT |
| Canvas UI | registry in `components.json`, vendored into `src/components/canvasui/` | MIT + Commons Clause |
| AIcss | `npm run ui:add:aicss`, vendored into `src/components/aicss/` | none stated |

All four are connected. The mechanisms differ because the libraries do: two are npm packages, one is
a shadcn registry, and one is a bespoke JSON API with no CLI, which is why `scripts/add-aicss.mjs`
exists.

### The licence question, and how it was settled

This document first recorded Canvas UI and AIcss as connected-but-not-vendored, pending a decision
about what may live in a public tree. That decision was made on 2026-08-19: Ratatoskr is not sold and
is not offered as a paid or hosted service, and both libraries are vendored on that basis.

The reasoning is worth keeping, because it is narrower than it looks. The Commons Clause withdraws
one right — to **Sell**, meaning to charge for the software or for a product or service whose value
derives substantially from it. It says nothing about publishing source that is not being sold. Canvas
UI's FAQ words its restriction more broadly than the clause it cites, and the clause governs. So the
condition is not "this repository is public" but "Ratatoskr is not sold", and **it is a condition
that can stop being true**. If Ratatoskr is ever sold, offered as a paid or hosted service, or
bundled into something that is, `src/components/canvasui/` has to come out before that happens.

AIcss states no licence at all — no licence file, no terms page, no repository, nothing in the
payload. "Free to use UI components" on a homepage is the author's stated intent rather than a grant
with terms, so what is vendored is deliberately small and confined to one directory, where it can be
identified and removed. Asking the author for an explicit licence stays on the follow-up list.

## The two that are installed

`thinking-orbs` renders nine loading states on a plain 2D canvas — no WebGL, no filters. Its `auto`
theme resolves from a `dark`/`light` class or `data-theme` on any ancestor, which is exactly the
convention `ThemeProvider` already uses here, so it matches the theme without configuration.

`liquid-gooey` runs SVG filters on a silhouette layer *underneath* a content layer that stays real
DOM. That architecture is the reason it is allowed: focus rings, hit targets and ARIA are never
inside the filter. `src/test/design-libraries.test.tsx` asserts that a button inside it is still a
button, so a future version that starts filtering the content layer fails the build rather than
quietly degrading the client.

Both ship `prefers-reduced-motion` handling in their built output — checked, not taken from the
README. Both declare `sideEffects: false` and carry no runtime dependencies, so while nothing imports
them they add nothing to the bundle.

Two things about `liquid-gooey` are worth knowing before reaching for it. It is `0.1.0`, so its API
is not settled. And it declares the `LiquidItem` type but does not export the component: the
supported form is `Liquid.Item`.

## Canvas UI

`@canvas-ui` is a registry in `components.json`, so components install the same way shadcn's own do:

```bash
npm run ui:add -- @canvas-ui/ripple-react
```

Files land in `src/components/canvasui/`, which is generated and governed by the same
never-hand-edit rule as `src/components/ui/`. `Ripple` is vendored as the first one, deliberately:
its registry entry declares no dependencies, it respects `prefers-reduced-motion` in its own source,
it marks its output canvas `aria-hidden`, and it degrades to plain interactive HTML when WebGL2 or
the html-in-canvas capability is missing. Six of the 35 React components pull `three.js`; those are a
separate dependency decision each time, not covered by this ADR.

Two technical constraints apply to every one of them:

- The html-in-canvas components rely on an experimental capability that is Chrome-behind-a-flag
  today. Everywhere else the content renders as ordinary HTML and the effect runs as a WebGL overlay.
- Content drawn into a canvas is not in the DOM. It cannot be selected, found by in-page search, or
  reached by a screen reader. For a client whose primary job is reading an archive, that rules out
  html-in-canvas for content outright. Effects as an overlay on real DOM are the only admissible use,
  and `docs/THREAT_MODEL.md` and the accessibility rules in `AGENTS.md` still apply on top.

## AIcss

AIcss serves its own JSON shape from `https://www.aicss.dev/r/{slug}` — not the shadcn registry-item
schema, and without a `.json` suffix — so `shadcn add` cannot reach it and `components.json` cannot
hold it. `scripts/add-aicss.mjs` is the install path instead:

```bash
npm run ui:add:aicss -- thinking-state
```

It fetches the payload, keeps the React flavour, and writes into `src/components/aicss/`, which is
generated under the same rules as the other two vendored directories.

What arrives needs three things it does not bring, and the first two are supplied by
`src/components/aicss-block.tsx`, which every vendored AIcss component is rendered through:

1. **Reduced motion.** `ThinkingState.module.css` runs `animation: label-shine 2.25s … infinite` with
   no `prefers-reduced-motion` query anywhere in the file. `AicssBlock` sets `data-vendored-motion`,
   which the backstop in `src/index.css` targets — the same mechanism the itshover icons use, one
   selector rather than one per library.
2. **Live-region semantics.** The component is a `<span>` reading "Thinking". A screen reader is
   never told the system started working, which for a status indicator is the entire point of it.
   `AicssBlock status` supplies `role="status"`. One caveat no wrapper can fix: a live region
   announces a *change*, not its initial content, so it has to be mounted before the message appears.
3. **Theme tokens.** These components hard-code hex values — `#a1a1a1` — rather than reading the
   theme, and `ThinkingState`'s `prefers-color-scheme: dark` block is a byte-for-byte copy of its
   light one, so it has no dark mode at all despite appearing to. This is not fixable in place, since
   the directory is regenerated. A component adopted for real use gets copied out into
   `src/components/` and its module CSS rewritten against the tokens, at which point it stops being
   vendored and becomes ours.

## Where each one fits, and where it does not

This client reads and administers a personal archive on one Raspberry Pi. It is not a chat surface,
and three of these four libraries were designed for one.

- **`thinking-orbs`** — the operation pipeline has an `Analysing` phase that can run for a long time.
  A tuned indeterminate indicator is a real fit there. Not as page furniture.
- **AIcss** — `streaming-text`, `task-list`, `code-block` and `data-table` map onto summary streaming
  and operation output if those views ever stream. `thinking-state` and `orbs` overlap with
  `thinking-orbs`; pick one, not both.
- **`liquid-gooey`** — a tab indicator or a menu that merges. One place, deliberately.
- **Canvas UI** — decoration on `/status` or a login screen at most. Never under content.

None of them may carry information that is not also available without them, and none may be the only
feedback for an interaction. Those rules are in `AGENTS.md` and they are not new: they are what the
itshover icons already answer to.

## Consequences

- `src/components/` now has three generated directories — `ui/`, `canvasui/`, `aicss/` — and
  `eslint.config.js` disables `react-refresh/only-export-components` and `no-empty` across all three
  in one block. Both rules are tripped by vendored source and stay on wherever a person writes code.
- `src/components/ui/NOTICE.md` is the record of what is vendored and under which licence, including
  the condition under which the Canvas UI source has to be removed.
- Two dependencies are installed and unused. `src/test/design-libraries.test.tsx` is what stops that
  from rotting silently: it mounts both, so a version of React or TypeScript that breaks them fails
  the gate rather than surprising whoever first reaches for one.
- `src/test/setup.ts` now stubs `matchMedia` and `ResizeObserver`. jsdom implements neither, and
  `liquid-gooey` throws on mount without them rather than degrading. Any future component that
  measures itself needs the same, so the stubs are in the shared setup rather than in one test.
- The bundle is unchanged while nothing imports them.
- Two libraries are blocked on a licence decision, and this document is where that decision gets
  recorded when it is made.

## Follow-up

Ask AIcss for an explicit licence. Until then, keep what is vendored from it small and in one
directory.

Re-read the Canvas UI condition before any change to how Ratatoskr is distributed. "Not sold" is a
fact about today, not a property of the code, and it is the only thing holding that vendored source
in place.
