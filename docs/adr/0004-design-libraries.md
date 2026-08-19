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
| Canvas UI | registry in `components.json`, nothing vendored | MIT + Commons Clause |
| AIcss | documented endpoint, nothing vendored | **none stated** |

The split is the decision. Installing an MIT package with no runtime dependencies costs nothing and
commits to nothing. Copying source into a public repository is publication, and two of these four
cannot be published here without a decision that is not mine to make.

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

## Canvas UI: connected, not vendored

Canvas UI is a shadcn registry, so `@canvas-ui` is in `components.json` and
`shadcn view @canvas-ui/<name>` resolves. That is configuration; it publishes nothing.

`shadcn add` would publish something. **Canvas UI is MIT + Commons Clause**, and Commons Clause is
not an open-source licence — it removes the right to sell, defined broadly. The project's own FAQ
puts it as: "The only restriction is reselling or redistributing the components themselves, whether
alone, in a bundle, or as a port." `ratatoskr-web` is a public repository, so a vendored component
sits in a public tree under a licence that restricts redistribution, next to a BSD-3-Clause `LICENSE`
that grants it.

Whether that is acceptable is a decision for whoever owns the repository, and it has to be made
before the first `add`, not discovered after. Until then the registry is a bookmark.

Two technical constraints belong with that decision:

- The html-in-canvas components rely on an experimental capability that is Chrome-behind-a-flag
  today. Everywhere else the content renders as ordinary HTML and the effect runs as a WebGL overlay.
- Content drawn into a canvas is not in the DOM. It cannot be selected, found by in-page search, or
  reached by a screen reader. For a client whose primary job is reading an archive, that rules out
  html-in-canvas for content outright. Effects as an overlay on real DOM are the only admissible use,
  and `docs/THREAT_MODEL.md` and the accessibility rules in `AGENTS.md` still apply on top.

## AIcss: documented, not connected

AIcss serves components from `https://www.aicss.dev/r/{slug}` — its own JSON shape, not the shadcn
registry-item schema, and without a `.json` suffix. There is no CLI path, so it cannot be a
`components.json` registry; the components are copy-paste.

**It states no licence.** The homepage says "Free to use UI components"; there is no licence page, no
terms page, no public repository, and the registry payload carries no licence field. Copying source
of unknown licence into a public repository is not a thing to do quietly, so nothing is vendored and
the endpoint is documented instead.

There is also a styling mismatch worth knowing: AIcss ships plain CSS modules with custom properties
and themes off `[data-theme]`, while this client themes off a `.dark` class and Tailwind tokens. A
component taken from there needs its theming rewritten, not just its file copied.

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

Ask the repository owner whether MIT + Commons Clause source may live in this public tree. If yes,
vendor Canvas UI components normally and extend `src/components/ui/NOTICE.md`. If no, the registry
entry should be removed rather than left as a trap.

For AIcss, ask its author for an explicit licence before copying anything.
