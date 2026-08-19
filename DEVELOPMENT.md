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
| Icons | `lucide-react` | The shadcn default |
| Lint | ESLint 10 with `typescript-eslint` 8 | |
| Format | Prettier 3.9 with `prettier-plugin-tailwindcss` | Source and configuration only. Prose is hand-wrapped and Prettier would reflow every document |
| Test | Vitest 4 with Testing Library and jsdom | |

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
```

This list and the one in `.github/workflows/ci.yml` are the same list, and the gate checks that they
are. If they drift, this file is the one that is wrong.

`npm audit --omit=dev --audit-level=high` runs after them. It asks about what a user actually
downloads; the build tooling is covered by Dependabot alerts.

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
