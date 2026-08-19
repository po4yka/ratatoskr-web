# Developing Ratatoskr Web

> Status: Proposed  
> Last reviewed: 2026-08-19

The toolchain is in place. No router, API client, view, or end-to-end suite is.

## Toolchain

| Part | Choice | Why it is this one |
|---|---|---|
| Language | TypeScript 6.0.3 | Not 7.0.2. See [The TypeScript ceiling](#the-typescript-ceiling) |
| UI | React 19.2 | |
| Components | shadcn/ui 4.18 on the Base UI base | ADR-0002 |
| Build | Vite 8.2 | |
| Styling | Tailwind CSS 4.3, via `@tailwindcss/vite` | No `tailwind.config.js`; the theme lives in `src/index.css` under `@theme inline` |
| Font | `@fontsource-variable/geist` | Self-hosted. A Google Fonts link would be a third-party request from a self-hosted deployment |
| Icons | `lucide-react` | The static default, imported by every generated component |
| Animated icons | itshover via `@itshover` registry, on `motion` 13 | The exception, where motion carries meaning. ADR-0003 |
| Design libraries | `thinking-orbs` 0.3, `liquid-gooey` 0.1 as npm packages; Canvas UI and AIcss vendored | ADR-0004. Canvas UI's licence is conditional on Ratatoskr not being sold |
| Lint | ESLint 10 with `typescript-eslint` 8 | |
| Format | Prettier 3.9 with `prettier-plugin-tailwindcss` | Source and configuration only. Prose is hand-wrapped and Prettier would reflow every document |
| Test | Vitest 4 with Testing Library and jsdom | |
| UI audit | `@shadscan/cli` 0.17 | Deterministic check for the UI fundamentals a shadcn app should have. In the gate |
| Agent audit | `shadcn/improve`, in `.agents/skills/` | Read-only advisor that writes plans. Not in the gate — see [Auditing](#auditing) |

## Getting started

```bash
npm ci
npm run dev
```

`npm ci` rather than `npm install`: it fails on a lockfile that disagrees with `package.json` instead
of quietly rewriting it, which is the only reason to commit a lockfile at all.

### The gate

Every command CI runs, in the order it runs them:

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run audit:ui -- --fail-under 69
```

This list and the one in `.github/workflows/ci.yml` are the same list, and the gate checks that they
are. If they drift, this file is the one that is wrong.

`npm audit --omit=dev --audit-level=high` runs after them. It asks about what a user actually
downloads; the build tooling is covered by Dependabot alerts.

## Auditing

Two audits, and they answer different questions. Neither replaces a review.

### shadscan — deterministic, in the gate

```bash
npm run audit:ui            # human report
npm run audit:ui:json       # machine-readable, for an agent or a diff
```

It reads the tree and reports missing UI fundamentals: error states without a wired retry, absent
document metadata, missing keyboard entry points, contrast and pointer-target risks. CI runs it with
`--fail-under 69`.

**That number is a ratchet, not a target.** It is the score this tree already has. The step fails on a
regression, not on the views that do not exist yet. When the score legitimately moves, move the number
in the same commit and say which finding changed.

Two things it reports today are deliberate, and neither is a defect to fix:

- **`toast-provider-*` and `command-menu-*`** — waived until there is a user action to report and a
  search to open. shadscan's own remediation says not to mount unused infrastructure for the score,
  and that advice is correct here. Revisit at implementation-plan steps 6 and 8.
- **`social-preview-present`** — waived permanently. Every route except `/status` is behind
  authentication; there is no link preview to build, and an `og:image` is one more thing a third
  party gets to fetch. `index.html` says so in a comment and `public/robots.txt` says the same to
  crawlers.

One is a false negative:

- **`theme-hotkey-present`** — the shortcut exists. `src/components/theme-provider.tsx` binds `d`,
  ignores modifier chords and guards editable targets, which is exactly what the remediation asks
  for. shadscan does not find it there. Do not add a second handler to satisfy the detector.

It can also check a rendered page — `npx shadscan --check-ui http://localhost:5173` — which is where
contrast, pointer-target size, and mobile overflow stop being advisory. That is not wired into CI
because there is nothing to render yet; it belongs with the end-to-end suite.

### Project skills — advisory, not in the gate

Ten are installed, all MIT, pinned in `skills-lock.json`: six on design and motion from
[emilkowalski/skills](https://github.com/emilkowalski/skills), two on engineering from
[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), `stop-slop` for prose, and
`improve`. `AGENTS.md` lists what each is for, which ones were rejected and why, and the rule that
this repository's own constraints win when a skill disagrees.

Three worth knowing before the first view: `animate` for building motion in the order the decisions
matter, `apple-design` §15 for typography on the reader view, and `frontend-ui-engineering` for the
loading, empty and error states this repository requires with every view rather than after it.

Restore them in a fresh clone with:

```bash
npx skills experimental_install
```

### improve — advisory, not in the gate

Installed as a project skill in `.agents/skills/improve/`, pinned by `skills-lock.json`, and linked
into `.claude/skills/`. Restore it with `npx skills experimental_install`.

```
/improve            audit, then plans in plans/
/improve branch     scoped to what this branch changes
/improve security   one category
```

It is read-only on source and never implements anything; the plan is what it produces. Use it before
a large change, or before a pull request with `/improve branch`. Its plans are plain markdown and are
meant to be reviewed, not executed unread.

Nothing here runs it automatically. An advisor whose output nobody reads is worse than no advisor,
and a judgement-based audit in a required check would block a merge on an opinion.

## Adding an icon

`lucide-react` is the default and needs no ceremony: import it. For an animated one:

```bash
npm run ui:add -- @itshover/refresh-icon
```

The `@itshover` registry is already in `components.json`, so the namespaced form works. The icon and
`types.ts` land in `src/components/ui/`, and `motion` is already a dependency.

Render it through `AnimatedIcon`, never directly — the generated component drops every prop except
`size`, `color`, `strokeWidth` and `className`, so accessibility attributes cannot reach it.
`AGENTS.md` has the rules and ADR-0003 has the reasoning.

Reduced motion is handled in two places and neither is optional:

- `MotionConfig reducedMotion="user"` in `src/main.tsx`, for declarative `motion` components;
- a CSS block in `src/index.css` scoped to `[data-animated-icon]`, for the imperative `animate()`
  these icons use, which `MotionConfig` does not reach. That gap was measured;
  `src/components/animated-icon.test.tsx` is the measurement.

## Adding a component from the other registries

```bash
npm run ui:add -- @canvas-ui/ripple-react     # Canvas UI, a shadcn registry
npm run ui:add:aicss -- thinking-state        # AIcss, its own JSON API
```

Both write into generated directories — `src/components/canvasui/` and `src/components/aicss/` —
that follow the same never-hand-edit rule as `src/components/ui/`. `src/components/ui/NOTICE.md`
records what is vendored and under which licence.

Every AIcss component is rendered through `AicssBlock`: they ship without reduced-motion handling and
without live-region semantics, and `src/components/aicss-block.tsx` supplies both. `AGENTS.md` has
the rules and ADR-0004 the reasoning.

One condition worth knowing before you extend the Canvas UI directory: it is MIT + Commons Clause,
vendored on the basis that Ratatoskr is not sold and not offered as a paid service. That is a fact
about today. If it changes, that directory comes out first.

## Adding a shadcn component

```bash
npm run ui:add -- button dialog
```

The CLI writes into `src/components/ui/`. That directory is generated, not authored:

- do not hand-edit a file in it to satisfy a linter — the next `shadcn add` of that component
  overwrites the edit and the problem returns with nothing to show for it;
- to change how a component behaves, compose around it or copy it out to `src/components/`;
- the base is Base UI and cannot be mixed. A snippet from the internet written against Radix will not
  work here, and neither will one written against React Aria;
- `components.json` records `style`, `baseColor` and `cssVariables`. The shadcn docs state that
  `baseColor` and `cssVariables` cannot be changed after initialization; changing them means
  deleting and re-installing every component.

`eslint.config.js` turns `react-refresh/only-export-components` off for that directory alone. shadcn
components export a `cva` variants object beside the component, which the rule rejects — shadcn's own
generated button fails shadcn's own generated ESLint config on a clean install. The rule stays on
everywhere a person actually writes a component.

## The TypeScript ceiling

The repository is on TypeScript 6.0.3 while 7.0.2 is the latest release. This is deliberate and
measured, not neglect:

```
typescript-eslint@8.67.0  peerDependencies.typescript  >=4.8.4 <6.1.0
```

No published `typescript-eslint` supports TypeScript 7. Taking 7 means giving up type-aware linting,
which is the strongest check in this list. shadcn's own Vite scaffold pins `typescript: ~6` for the
same reason.

Re-check when `typescript-eslint` publishes a release whose peer range admits 7.x, and raise both in
one commit.

## Workflow

1. Build the fetch gateway, refresh, and error normalization once, before the second view.
2. Generate API types from the pinned contract; a drift fails the build.
3. Build loading, empty, error, partial, and unauthorized states with every view, not after it.
4. Query by role and accessible name in tests. A control that exists only as a styled `div` passes a
   snapshot and fails a user.
5. Test against a local mock Platform or the workspace Compose profile, never a live deployment.

No provider token, real archive fixture, or production endpoint is ever required to run this
repository.
