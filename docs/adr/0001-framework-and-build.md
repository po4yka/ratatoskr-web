# ADR-0001: React, TypeScript, Vite

> Status: Accepted  
> Date: 2026-08-19

## Context

The client needs a framework, a language, and a build tool before anything else can be written. The
deployment is one self-hosted machine described in `ratatoskr-workspace/docs/DEPLOYMENT_TARGET.md`:
one origin, one bundle, no CDN, no edge runtime, and no third-party host in the serving path.

## Options

**React with Vite, client-rendered.** A static bundle served by the deployment's own origin. No
server runtime, no rendering process to supervise, no second thing systemd has to keep alive.

**Next.js.** Server rendering would help first paint on a large archive, and the shadcn default
template is Next. It also introduces a Node server on the target machine, a second supervised
process, and a rendering layer between the client and the Edge API that Platform already is.

**Server-rendered templates from Platform.** Removes the client entirely. It also puts view logic in
a Rust service that owns domain logic, which is the coupling the whole repository split exists to
avoid.

## Decision

React 19 with TypeScript, built by Vite 8 into a static bundle.

The deciding argument is the deployment, not the framework: this is one Raspberry Pi running every
Ratatoskr service under systemd. A rendering server buys first paint on an archive the user is
already authenticated into, and costs a supervised process on a machine whose resource budget is
written down. The client is behind authentication for every route except `/status`, so there is no
crawler and no cold visitor to render for.

TypeScript is pinned to `~6.0.3` rather than the newer 7.0.2. No published `typescript-eslint`
supports 7 — its peer range is `>=4.8.4 <6.1.0` — so taking the newer compiler means giving up
type-aware linting. shadcn's own Vite scaffold pins `~6` for the same reason.

## Consequences

- No server-side rendering, so first paint is a bundle download. `docs/ARCHITECTURE.md` section 15
  makes route splitting and reader performance explicit rather than assumed.
- No server runtime to deploy, supervise, or patch.
- The build is deterministic and its output is files.
- The TypeScript pin is a ceiling with a named trigger: raise it with `typescript-eslint`, in one
  commit, when that package admits 7.x.

## Validation

`npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` all pass on the commit that
introduced them, and `.github/workflows/ci.yml` runs the same list.

## Follow-up

Revisit if the status page ever needs to be indexable, or if measured first paint on the reader is
bad enough on the target hardware that a rendering server earns its supervision cost.
