# ADR-0002: shadcn/ui on the Base UI base

> Status: Accepted  
> Date: 2026-08-19

## Context

The client needs accessible primitives — dialog, menu, combobox, tabs, tooltip, table — and this
repository's own rules make accessibility structural rather than a late pass: keyboard operability,
visible focus, correct roles, contrast in both themes.

shadcn/ui 4.18 is not a component library. The CLI copies component source into the repository, so
the components are ours to run and to read. As of 2026 it generates against one of three bases, and
the choice is per-project and not mixable:

- **Base UI**, the default since July 2026, built by the Radix team as its successor;
- **Radix**, the original, now a single `radix-ui` package;
- **React Aria**, added July 2026, from Adobe.

## Decision

shadcn/ui with the **Base UI** base, `style: base-nova`, `baseColor: neutral`, `cssVariables: true`.

Base UI is the shadcn default, which is the argument that matters most for a repository that coding
agents work in: the default is what the documentation, the blocks, the presets, and the CLI's own
scaffold are written against, and it is the path with the fewest places to be silently wrong. It is
also what the retired first-generation client used, so the archive in `ratatoskr-workspace` remains
readable as a reference.

React Aria was the serious alternative and has the strongest accessibility story of the three. It was
not chosen because it is the youngest base in shadcn, and the accessibility guarantees this
repository needs are ones `docs/TESTING.md` verifies directly rather than inherits.

`baseColor` and `cssVariables` are recorded here because the shadcn documentation states they cannot
be changed after initialization; changing either means deleting and re-installing every component.

## Consequences

- `src/components/ui/` is generated. Hand-edits there are overwritten by the next `shadcn add`, so
  `AGENTS.md` forbids them and directs changes to composition instead.
- Most shadcn material on the internet targets Radix, because it was the only base until 2026. A
  copied snippet will import `@radix-ui/react-*` and will not work. This is the most likely way an
  agent breaks this repository, and it is called out in `AGENTS.md`.
- `eslint.config.js` disables `react-refresh/only-export-components` for the generated directory:
  shadcn components export a `cva` variants object beside the component, and shadcn's own generated
  button fails shadcn's own generated ESLint config without it.
- Theming lives in `src/index.css` under `@theme inline`. There is no `tailwind.config.js`.
- The font ships from `@fontsource-variable/geist`, self-hosted. A Google Fonts link would be a
  third-party request from a self-hosted deployment, which `SECURITY.md` forbids.

## Validation

`npm ci`, typecheck, lint, format, test and build pass with the generated `button` component in the
tree, and the test queries it by role and accessible name rather than by test id.

## Follow-up

Re-open if Base UI's component coverage blocks a view the plan needs, or if an accessibility defect
is traced to a primitive rather than to how it is used here.
