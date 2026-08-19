# Vendored components

Three directories under `src/components/` hold source written by a generator, not by hand:

| Directory | Written by | Source | Licence |
|---|---|---|---|
| `ui/` | `npm run ui:add` | [shadcn/ui](https://ui.shadcn.com) on the Base UI base | MIT |
| `ui/` | `npm run ui:add -- @itshover/...` | [itshover](https://github.com/itshover/itshover) | Apache-2.0 |
| `canvasui/` | `npm run ui:add -- @canvas-ui/...` | [Canvas UI](https://canvasui.dev) | MIT + Commons Clause |
| `aicss/` | `npm run ui:add:aicss -- <slug>` | [AIcss](https://www.aicss.dev) | none stated |

Re-running a generator overwrites what it wrote. Do not hand-edit anything in these directories — see
`AGENTS.md`. To take ownership of a component, copy it out into `src/components/` under a new name;
at that point it stops being vendored and the rules above stop applying to it.

## Licence notes

**itshover** — the repository README says MIT and its `LICENSE` file is Apache License 2.0. The file
governs. Apache-2.0 permits this use and requires the licence and attribution be preserved, which is
what this file does.

**Canvas UI** — MIT plus the Commons Clause. The clause withdraws the right to **Sell**: to charge
for the software, or for a product or service whose value derives substantially from it. It does not
restrict use, modification, or publication of source that is not being sold. Ratatoskr is
self-hosted, is not sold, and is not offered as a paid service, so the clause does not bite; that is
the basis on which this source lives in a public tree beside a BSD-3-Clause `LICENSE`. Canvas UI's own
FAQ words the restriction more broadly than the clause text does. **If Ratatoskr is ever sold, offered
as a paid or hosted service, or bundled into something that is, this vendored source has to come out
first.** See [ADR-0004](../../docs/adr/0004-design-libraries.md).

**AIcss** — states no licence anywhere: no licence file, no terms page, no public repository, and no
licence field in the registry payload. The site says "Free to use UI components", which is the
author's stated intent and not a grant with terms. What is vendored here is a small amount of source
kept in one directory so it can be identified and removed. Ask the author for an explicit licence
before this grows.

## What is vendored today

- `ui/button.tsx` — shadcn/ui.
- `ui/refresh-icon.tsx`, `ui/types.ts` — itshover.
- `canvasui/Ripple.tsx` — Canvas UI.
- `aicss/ThinkingState.tsx`, `aicss/ThinkingState.module.css` — AIcss.
